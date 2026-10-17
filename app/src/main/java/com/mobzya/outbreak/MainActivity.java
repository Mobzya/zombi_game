package com.mobzya.outbreak;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView game;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(5894 | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        game = new WebView(this);
        game.setBackgroundColor(0xff101417);
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(true);
        game.getSettings().setMediaPlaybackRequiresUserGesture(false);
        game.setWebChromeClient(new WebChromeClient());
        game.setWebViewClient(new WebViewClient());
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(game);
        game.loadUrl("file:///android_asset/index.html");
    }
    @Override public void onBackPressed() { if (game != null) game.evaluateJavascript("window.handleBack&&window.handleBack()", null); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (game != null) {game.destroy();game=null;} super.onDestroy(); }
}
