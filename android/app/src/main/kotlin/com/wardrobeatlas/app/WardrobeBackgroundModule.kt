package com.wardrobeatlas.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Build
import android.util.Base64
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.mlkit.common.MlKitException
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import java.io.ByteArrayOutputStream
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
        val out = ByteArrayOutputStream()
        @Suppress("DEPRECATION")
        val format = if (Build.VERSION.SDK_INT >= 30) Bitmap.CompressFormat.WEBP_LOSSY else Bitmap.CompressFormat.WEBP
        cutout.compress(format, 80, out)
        promise.resolve(Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP))
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
}

class WardrobeBackgroundPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WardrobeBackgroundModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
