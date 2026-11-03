package com.wardrobeatlas.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions

// On-device translation of category names (ML Kit). The language pack is
// downloaded on first use; after that it works offline.
class WardrobeTranslatorModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "WardrobeTranslator"

  @ReactMethod
  fun translate(text: String, source: String, target: String, promise: Promise) {
    val from = TranslateLanguage.fromLanguageTag(source)
    val to = TranslateLanguage.fromLanguageTag(target)
    if (from == null || to == null) {
      promise.reject("TRANSLATE", "Unsupported language")
      return
    }
    val translator = Translation.getClient(
      TranslatorOptions.Builder().setSourceLanguage(from).setTargetLanguage(to).build()
    )
    translator.downloadModelIfNeeded(DownloadConditions.Builder().build())
      .onSuccessTask { translator.translate(text) }
      .addOnSuccessListener { translated -> promise.resolve(translated) }
      .addOnFailureListener { error -> promise.reject("TRANSLATE", "Translation unavailable", error) }
      .addOnCompleteListener { translator.close() }
  }
}

class WardrobeTranslatorPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(WardrobeTranslatorModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
