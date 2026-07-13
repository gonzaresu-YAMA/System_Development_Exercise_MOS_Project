package com.midori.mos_backend.util;

import com.midori.mos_backend.Entity.Order;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * レジ（POS）連携用のhash値を計算するユーティリティ
 *
 * 注文のid・更新日時・会計状況から決定的に計算する（DBに保存しない）。
 * これにより、注文内容や会計状況が変わるたびにhashも変わり、
 * レジ側が古い状態を前提にupdateStatusを呼んだ場合に検出できる（楽観ロック）。
 */
public final class PosHashUtil {

    private PosHashUtil() {
    }

    public static String computeHash(Order order) {
        String raw = order.getId() + "|" + order.getUpdatedAt() + "|" + order.getBillStatus();

        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] bytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("MD5アルゴリズムが利用できません。", e);
        }
    }
}
