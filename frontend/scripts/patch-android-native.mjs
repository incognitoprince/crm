import fs from "node:fs";
import path from "node:path";

const mainActivity = path.resolve("android/app/src/main/java/com/tailorshop/crm/MainActivity.java");
if (!fs.existsSync(mainActivity)) {
  throw new Error("Capacitor MainActivity.java was not found at " + mainActivity);
}

const source = `package com.tailorshop.crm;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Apply system-bar insets to the native content container, not the
        // HTML document, so scrolling cannot move content under the status bar.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        View content = findViewById(android.R.id.content);
        final int left = content.getPaddingLeft();
        final int right = content.getPaddingRight();
        final int bottom = content.getPaddingBottom();
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
            view.setPadding(left, bars.top, right, bottom);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(content);
    }
}
`;

fs.writeFileSync(mainActivity, source, "utf8");
console.log("Applied native Android system-bar inset handling.");
