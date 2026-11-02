package com.myclosetx

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint
import com.facebook.react.defaults.DefaultReactHost

class MainApplication : Application(), ReactApplication {

  private var mReactHost: ReactHost? = null

  override val reactHost: ReactHost
    get() {
      if (mReactHost == null) {
        val packages = PackageList(this).packages.toMutableList()
        mReactHost = DefaultReactHost.getDefaultReactHost(
          applicationContext,
          packages
        )
      }
      return mReactHost!!
    }

  override fun onCreate() {
    super.onCreate()
    ReactNativeApplicationEntryPoint.loadReactNative(this)
  }
}
