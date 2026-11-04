package com.wardrobeatlas.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.Shader
import android.os.Build
import android.util.Base64
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.mlkit.common.MlKitException
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import org.tensorflow.lite.Interpreter
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.concurrent.Executors

// Cuts the garment out of a photo on the device (ML Kit subject
// segmentation) and returns it as a transparent WebP, same size as the photo.
class WardrobeBackgroundModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val worker = Executors.newSingleThreadExecutor()

  override fun getName() = "WardrobeBackground"

  @ReactMethod
  fun removeBackground(base64: String, promise: Promise) {
    if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) != ConnectionResult.SUCCESS) {
      promise.reject("UNSUPPORTED", "Google Play services are not available")
      return
    }
    val bytes = try { Base64.decode(base64, Base64.DEFAULT) } catch (error: IllegalArgumentException) { null }
    val photo = bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
    if (photo == null) {
      promise.reject("FAILED", "Unreadable photo")
      return
    }
    val segmenter = SubjectSegmentation.getClient(
      SubjectSegmenterOptions.Builder().enableForegroundBitmap().build()
    )
    segmenter.process(InputImage.fromBitmap(photo, 0))
      .addOnSuccessListener(worker) { result ->
        val cutout = result.foregroundBitmap
        if (cutout == null || !hasSubject(cutout)) {
          promise.reject("NO_SUBJECT", "No garment found")
          return@addOnSuccessListener
        }
        promise.resolve(webp(cutout))
      }
      .addOnFailureListener { error ->
        // The model arrives through Play services and may still be downloading.
        if (error is MlKitException && error.errorCode == MlKitException.UNAVAILABLE)
          promise.reject("PREPARING", "Background removal is getting ready", error)
        else promise.reject("FAILED", "Background removal failed", error)
      }
      .addOnCompleteListener { segmenter.close() }
  }

  // At least 1% of the pixels must be kept for the cutout to count.
  private fun hasSubject(bitmap: Bitmap): Boolean {
    val pixels = IntArray(bitmap.width * bitmap.height)
    bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
    return pixels.count { (it ushr 24) > 32 } >= pixels.size / 100
  }

  private fun webp(bitmap: Bitmap): String {
    val out = ByteArrayOutputStream()
    @Suppress("DEPRECATION")
    val format = if (Build.VERSION.SDK_INT >= 30) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP
    bitmap.compress(format, 80, out)
    return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
  }

  // The garment model (U²-Net cloth segmentation) is downloaded by the app,
  // so the interpreter is created on first use and kept for the next photos.
  private var garmentModel: Pair<String, Interpreter>? = null

  private fun interpreter(path: String): Interpreter {
    garmentModel?.let { (loaded, interpreter) -> if (loaded == path) return interpreter else interpreter.close() }
    return Interpreter(File(path), Interpreter.Options().setNumThreads(4)).also { garmentModel = path to it }
  }

  // Keeps only one garment of a photo of someone wearing it: the upper-body
  // garment, the lower-body one, or "any" (whichever covers the most).
  // Returns a transparent WebP the same size as the photo.
  @ReactMethod
  fun isolateGarment(base64: String, modelPath: String, part: String, promise: Promise) {
    worker.execute {
      try {
        val bytes = try { Base64.decode(base64, Base64.DEFAULT) } catch (error: IllegalArgumentException) { null }
        val photo = bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
        if (photo == null) {
          promise.reject("FAILED", "Unreadable photo")
          return@execute
        }
        val model = try { interpreter(modelPath) } catch (error: Exception) {
          garmentModel = null
          promise.reject("NO_MODEL", "The garment model can't be loaded", error)
          return@execute
        }
        val alpha = garmentAlpha(model, photo, part)
        if (alpha == null) {
          promise.reject("NO_SUBJECT", "No garment found")
          return@execute
        }
        promise.resolve(webp(applyAlpha(photo, alpha)))
      } catch (error: Throwable) {
        promise.reject("FAILED", "Garment isolation failed", error)
      }
    }
  }

  // Opacity per model pixel (SIZE x SIZE) of the chosen garment, or null if
  // there's none. Classes: 0 background, 1 upper body, 2 lower body, 3 full body.
  private fun garmentAlpha(model: Interpreter, photo: Bitmap, part: String): FloatArray? {
    val plane = SIZE * SIZE
    // Earlier cutouts are transparent; the model expects an opaque photo.
    val square = Bitmap.createBitmap(SIZE, SIZE, Bitmap.Config.ARGB_8888)
    Canvas(square).apply {
      drawColor(Color.WHITE)
      drawBitmap(photo, null, Rect(0, 0, SIZE, SIZE), Paint(Paint.FILTER_BITMAP_FLAG))
    }
    val pixels = IntArray(plane)
    square.getPixels(pixels, 0, SIZE, 0, 0, SIZE, SIZE)
    // NCHW, RGB scaled to [-1, 1]
    val input = ByteBuffer.allocateDirect(4 * 3 * plane).order(ByteOrder.nativeOrder())
    val channels = input.asFloatBuffer()
    for (i in 0 until plane) {
      val color = pixels[i]
      channels.put(i, ((color shr 16) and 0xff) / 127.5f - 1f)
      channels.put(plane + i, ((color shr 8) and 0xff) / 127.5f - 1f)
      channels.put(2 * plane + i, (color and 0xff) / 127.5f - 1f)
    }
    val output = ByteBuffer.allocateDirect(4 * CLASSES * plane).order(ByteOrder.nativeOrder())
    model.run(input, output)
    output.rewind()
    val logits = FloatArray(CLASSES * plane)
    output.asFloatBuffer().get(logits)

    val best = IntArray(plane)
    val counts = IntArray(CLASSES)
    for (i in 0 until plane) {
      var top = 0
      for (c in 1 until CLASSES) if (logits[c * plane + i] > logits[top * plane + i]) top = c
      best[i] = top
      counts[top]++
    }
    val enough = plane / 100
    // A dress or overall counts as the full-body class, so it's the fallback.
    val chosen = when (part) {
      "upper" -> if (counts[1] >= enough) 1 else 3
      "lower" -> if (counts[2] >= enough) 2 else 3
      else -> (1 until CLASSES).maxByOrNull { counts[it] } ?: 1
    }
    val kept = largestRegions(BooleanArray(plane) { best[it] == chosen })
    if (kept.count { it } < enough) return null

    // Solid inside; scaling down to the photo smooths the edges.
    return FloatArray(plane) { if (kept[it]) 1f else 0f }
  }

  // Drops stray specks: keeps connected regions at least a tenth the size of
  // the biggest one.
  private fun largestRegions(mask: BooleanArray): BooleanArray {
    val region = IntArray(mask.size) { -1 }
    val sizes = ArrayList<Int>()
    val queue = IntArray(mask.size)
    for (start in mask.indices) {
      if (!mask[start] || region[start] >= 0) continue
      val id = sizes.size
      var head = 0
      var tail = 0
      queue[tail++] = start
      region[start] = id
      while (head < tail) {
        val i = queue[head++]
        val x = i % SIZE
        val y = i / SIZE
        for (j in intArrayOf(if (x > 0) i - 1 else -1, if (x < SIZE - 1) i + 1 else -1, if (y > 0) i - SIZE else -1, if (y < SIZE - 1) i + SIZE else -1)) {
          if (j >= 0 && mask[j] && region[j] < 0) {
            region[j] = id
            queue[tail++] = j
          }
        }
      }
      sizes.add(tail)
    }
    val biggest = sizes.maxOrNull() ?: return mask
    return BooleanArray(mask.size) { region[it] >= 0 && sizes[region[it]] * 10 >= biggest }
  }

  // Scales the model's opacity map up to the photo and applies it.
  private fun applyAlpha(photo: Bitmap, alpha: FloatArray): Bitmap {
    val width = photo.width
    val height = photo.height
    val pixels = IntArray(width * height)
    photo.getPixels(pixels, 0, width, 0, 0, width, height)
    for (y in 0 until height) {
      val my = ((y + 0.5f) * SIZE / height - 0.5f).coerceIn(0f, SIZE - 1f)
      val y0 = my.toInt()
      val y1 = minOf(y0 + 1, SIZE - 1)
      val fy = my - y0
      for (x in 0 until width) {
        val mx = ((x + 0.5f) * SIZE / width - 0.5f).coerceIn(0f, SIZE - 1f)
        val x0 = mx.toInt()
        val x1 = minOf(x0 + 1, SIZE - 1)
        val fx = mx - x0
        val a = (alpha[y0 * SIZE + x0] * (1 - fx) + alpha[y0 * SIZE + x1] * fx) * (1 - fy) +
          (alpha[y1 * SIZE + x0] * (1 - fx) + alpha[y1 * SIZE + x1] * fx) * fy
        val i = y * width + x
        val opacity = ((pixels[i] ushr 24) * a).toInt()
        pixels[i] = (opacity shl 24) or (pixels[i] and 0xffffff)
      }
    }
    return Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
  }

  private fun decode(base64: String): Bitmap? {
    val bytes = try { Base64.decode(base64, Base64.DEFAULT) } catch (error: IllegalArgumentException) { null }
    return bytes?.let { BitmapFactory.decodeByteArray(it, 0, it.size) }
  }

  // Applies hand-painted fixes to a cutout. Each stroke has a mode ("erase"
  // clears, "restore" brings back the original photo), a brush size as a
  // fraction of the image width and points as x, y fractions of the image.
  @ReactMethod
  fun editCutout(cutout: String, original: String, strokes: ReadableArray, promise: Promise) {
    worker.execute {
      try {
        val image = decode(cutout)?.copy(Bitmap.Config.ARGB_8888, true)
        if (image == null) {
          promise.reject("FAILED", "Unreadable cutout")
          return@execute
        }
        val source = if (original.isEmpty()) null else decode(original)?.let {
          if (it.width == image.width && it.height == image.height) it
          else Bitmap.createScaledBitmap(it, image.width, image.height, true)
        }
        val canvas = Canvas(image)
        for (k in 0 until strokes.size()) {
          val stroke = strokes.getMap(k) ?: continue
          val points = stroke.getArray("points") ?: continue
          val restore = stroke.getString("mode") == "restore"
          if (points.size() < 2 || (restore && source == null)) continue
          val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeCap = Paint.Cap.ROUND
            strokeJoin = Paint.Join.ROUND
            strokeWidth = (stroke.getDouble("size") * image.width).toFloat()
            if (restore) {
              shader = BitmapShader(source!!, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
              xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC)
            } else xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
          }
          val path = Path()
          for (p in 0 until points.size() / 2) {
            val x = (points.getDouble(2 * p) * image.width).toFloat()
            val y = (points.getDouble(2 * p + 1) * image.height).toFloat()
            if (p == 0) path.moveTo(x, y) else path.lineTo(x, y)
          }
          // A tap leaves a dot.
          if (points.size() < 4) path.rLineTo(0.1f, 0f)
          canvas.drawPath(path, paint)
        }
        promise.resolve(webp(image))
      } catch (error: Throwable) {
        promise.reject("FAILED", "The cutout couldn't be edited", error)
      }
    }
  }

  // Up to three main colors of a cutout, most common first, ignoring its
  // transparent background. Colors closer than a small distance count as one.
  @ReactMethod
  fun cutoutColors(base64: String, promise: Promise) {
    worker.execute {
      try {
        val photo = decode(base64)
        if (photo == null) {
          promise.reject("FAILED", "Unreadable cutout")
          return@execute
        }
        val scale = minOf(1f, 96f / maxOf(photo.width, photo.height))
        val small = Bitmap.createScaledBitmap(
          photo, maxOf(1, (photo.width * scale).toInt()), maxOf(1, (photo.height * scale).toInt()), true
        )
        val pixels = IntArray(small.width * small.height)
        small.getPixels(pixels, 0, small.width, 0, 0, small.width, small.height)
        // Buckets of 16 levels per channel: summed r, g, b and a count.
        val buckets = HashMap<Int, IntArray>()
        var total = 0
        for (color in pixels) {
          if ((color ushr 24) < 200) continue
          val r = (color shr 16) and 0xff
          val g = (color shr 8) and 0xff
          val b = color and 0xff
          val sums = buckets.getOrPut(((r shr 4) shl 8) or ((g shr 4) shl 4) or (b shr 4)) { IntArray(4) }
          sums[0] += r
          sums[1] += g
          sums[2] += b
          sums[3]++
          total++
        }
        if (total == 0) {
          promise.reject("NO_SUBJECT", "The cutout is empty")
          return@execute
        }
        val chosen = ArrayList<IntArray>()
        for (sums in buckets.values.sortedByDescending { it[3] }) {
          // Second and third colors need at least 5% of the garment.
          if (chosen.size == 3 || (chosen.isNotEmpty() && sums[3] * 20 < total)) break
          val color = intArrayOf(sums[0] / sums[3], sums[1] / sums[3], sums[2] / sums[3])
          val distinct = chosen.all { other ->
            (0..2).sumOf { (color[it] - other[it]) * (color[it] - other[it]) } > 48 * 48
          }
          if (distinct) chosen.add(color)
        }
        val result = Arguments.createArray()
        chosen.forEach { result.pushString(String.format("#%02X%02X%02X", it[0], it[1], it[2])) }
        promise.resolve(result)
      } catch (error: Throwable) {
        promise.reject("FAILED", "Colors couldn't be read", error)
      }
    }
  }

  override fun invalidate() {
    garmentModel?.second?.close()
    garmentModel = null
    worker.shutdown()
    super.invalidate()
  }

  private companion object {
    const val SIZE = 768
    const val CLASSES = 4
  }
}

class WardrobeBackgroundPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WardrobeBackgroundModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
