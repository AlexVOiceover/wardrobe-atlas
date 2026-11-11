package com.wardrobeatlas.app

import android.net.Uri
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ViewManager
import java.io.File
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

// Backups are ZIP files: wardrobe.json and a photos folder. Data streams
// straight between files and the document the user picked, so a large backup
// never has to fit in memory.
class WardrobeArchiveModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "WardrobeArchive"

  /** Writes the files (ZIP entry name → file path) into the picked document. */
  @ReactMethod
  fun zip(entries: ReadableMap, uri: String, promise: Promise) {
    Thread {
      try {
        val output = context.contentResolver.openOutputStream(Uri.parse(uri), "wt")
          ?: throw IllegalStateException("Can't write the backup")
        ZipOutputStream(output.buffered()).use { zip ->
          val names = entries.keySetIterator()
          while (names.hasNextKey()) {
            val name = names.nextKey()
            val path = entries.getString(name) ?: continue
            zip.putNextEntry(ZipEntry(name))
            File(path).inputStream().use { it.copyTo(zip) }
            zip.closeEntry()
          }
        }
        promise.resolve(true)
      } catch (error: Exception) {
        promise.reject("ZIP", error.message ?: "Couldn't write the backup", error)
      }
    }.start()
  }

  /**
   * Unpacks the picked document into a folder and resolves how many files it
   * held. An entry that would land outside the folder fails the whole unzip.
   */
  @ReactMethod
  fun unzip(uri: String, folder: String, promise: Promise) {
    Thread {
      try {
        val target = File(folder).canonicalFile
        target.mkdirs()
        val input = context.contentResolver.openInputStream(Uri.parse(uri))
          ?: throw IllegalStateException("Can't read the backup")
        var files = 0
        ZipInputStream(input.buffered()).use { zip ->
          while (true) {
            val entry = zip.nextEntry ?: break
            val file = File(target, entry.name).canonicalFile
            if (!file.path.startsWith(target.path + File.separator))
              throw SecurityException("Unexpected entry: ${entry.name}")
            if (entry.isDirectory) {
              file.mkdirs()
            } else {
              file.parentFile?.mkdirs()
              file.outputStream().use { zip.copyTo(it) }
              files++
            }
          }
        }
        promise.resolve(files)
      } catch (error: Exception) {
        promise.reject("UNZIP", error.message ?: "Couldn't read the backup", error)
      }
    }.start()
  }
}

class WardrobeArchivePackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WardrobeArchiveModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
