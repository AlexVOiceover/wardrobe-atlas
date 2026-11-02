package com.myclosetx

import android.app.Application
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.dieam.reactnativepushnotification.modules.RNPushNotificationHelper

object LegacyReminderCleanup {
  fun cancel(context: Context) {
    try {
      RNPushNotificationHelper(context.applicationContext as Application)
        .cancelScheduledNotification("1")
    } catch (error: Exception) {
      Log.w("WardrobeAtlas", "Unable to cancel the retired logging reminder", error)
    }
  }
}

class LegacyReminderCleanupReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
      LegacyReminderCleanup.cancel(context)
    }
  }
}
