# Preserve Stripe Android Push Provisioning classes required by R8.
-keep class com.stripe.android.pushprovisioning.** { *; }
-dontwarn com.stripe.android.pushprovisioning.**
