package com.myclosetx

import android.content.Intent
import android.content.pm.PackageInfo
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import java.io.File

@Suppress("DEPRECATION")
class WardrobeUpdatesModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "WardrobeUpdates"

  private fun version(info: PackageInfo): Long =
    if (Build.VERSION.SDK_INT >= 28) info.longVersionCode else info.versionCode.toLong()

  override fun getConstants(): MutableMap<String, Any> {
    val info = context.packageManager.getPackageInfo(context.packageName, 0)
    return mutableMapOf("buildNumber" to version(info).toDouble(), "versionName" to (info.versionName ?: ""))
  }

  private fun allowed() = Build.VERSION.SDK_INT < 26 || context.packageManager.canRequestPackageInstalls()

  @ReactMethod
  fun canInstallPackages(promise: Promise) { promise.resolve(allowed()) }

  @ReactMethod
  fun openInstallSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= 26) {
        context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}"))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("INSTALL_SETTINGS", "Unable to open install settings", error) }
  }

  @ReactMethod
  fun installApk(path: String, promise: Promise) {
    try {
      if (!allowed()) { promise.reject("INSTALL_PERMISSION", "Installation permission is required"); return }
      val file = File(path).canonicalFile
      require(file.isFile && file.path.startsWith(context.cacheDir.canonicalPath + File.separator)) { "Invalid update file" }
      val archive = context.packageManager.getPackageArchiveInfo(file.path, 0)
        ?: throw IllegalArgumentException("Invalid APK")
      val installed = context.packageManager.getPackageInfo(context.packageName, 0)
      require(archive.packageName == context.packageName && version(archive) > version(installed)) { "APK is not a newer version of this app" }
      val uri = FileProvider.getUriForFile(context, context.packageName + ".provider", file)
      context.startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK))
      promise.resolve(true)
    } catch (error: Exception) { promise.reject("INSTALL_APK", "Unable to open the Android installer", error) }
  }
}

class WardrobeUpdatesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WardrobeUpdatesModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
