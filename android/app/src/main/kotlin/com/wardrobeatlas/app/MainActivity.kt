package com.wardrobeatlas.app

import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // From Android 15 the app draws under the keyboard and adjustResize no
    // longer shrinks it, so the keyboard covered fields low on the screen.
    // Lifting the app above the keyboard restores the old behavior; scroll
    // views then keep the focused field in view.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      val content = findViewById<View>(android.R.id.content)
      ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
        val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
        view.setPadding(0, 0, 0, keyboard)
        insets
      }
    }
  }

  override fun getMainComponentName(): String = "WardrobeAtlas"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
