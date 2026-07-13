package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Order;
import com.midori.mos_backend.dto.pos.PosApiException;
import com.midori.mos_backend.dto.pos.PosOrderRequest;
import com.midori.mos_backend.dto.pos.PosOrderResponse;
import com.midori.mos_backend.repository.OrderRepository;
import com.midori.mos_backend.util.PosHashUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * レジ（POS）連携専用のサービス
 *
 * POS側（regi）の MosOrdersApi と対になる。単一エンドポイント POST /api/orders に対し、
 * getOrders（注文取得）と updateStatus（会計状況更新）を提供する。
 */
@Service
@Transactional
public class PosOrderService {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final Pattern CUSTOMER_ID_PATTERN = Pattern.compile("^[0-9]{7}$");
    private static final Pattern HASH_PATTERN = Pattern.compile("^[0-9a-f]{8,64}$");
    /** billStatus は 1〜15（4bitのビットマスク） */
    private static final int BILL_STATUS_MAX = 0b1111;

    private final OrderRepository orderRepository;
    private final String storeId;
    private final int taxRate;

    public PosOrderService(OrderRepository orderRepository,
                           @Value("${mos.pos.store-id:MH}") String storeId,
                           @Value("${mos.pos.tax-rate:10}") int taxRate) {
        this.orderRepository = orderRepository;
        this.storeId = storeId;
        this.taxRate = taxRate;
    }

    /**
     * 注文取得（method="getOrders"）
     *
     * @return POS形式の注文リスト（該当なしは空リスト）
     */
    @Transactional(readOnly = true)
    public List<PosOrderResponse> getOrders(PosOrderRequest request) {
        String customerId = normalizeCustomerId(request.getCustomerId());
        validateBillStatusNullable(request.getBillStatus());
        LocalDateTime fromTime = parseIsoNullable(request.getFromTime(), "fromTime");
        LocalDateTime toTime = parseIsoNullable(request.getToTime(), "toTime");

        List<Order> orders = orderRepository.findForPos(
                customerId, fromTime, toTime, Order.Status.CANCELLED);

        // billStatus はビット和での絞り込み（指定ビットのいずれかを含む注文だけ残す）
        Integer billStatus = request.getBillStatus();
        return orders.stream()
                .filter(o -> billStatus == null || (o.getBillStatus() & billStatus) != 0)
                .map(o -> PosOrderResponse.from(o, storeId, taxRate))
                .collect(Collectors.toList());
    }

    /**
     * 会計状況更新（method="updateStatus"）
     *
     * hash が指定された場合は現在値と照合し、不一致なら HASH_MISMATCH を返す（楽観ロック）。
     * 正常時はレスポンスボディなし（Controller が 200 空ボディで返す）。
     */
    public void updateStatus(PosOrderRequest request) {
        String customerId = normalizeCustomerId(request.getCustomerId());
        if (customerId == null) {
            throw new PosApiException(400, "INVALID_REQUEST", "customerId は必須です。");
        }
        validateHashNullable(request.getHash());
        if (request.getBillStatus() == null) {
            throw new PosApiException(400, "INVALID_REQUEST", "billStatus は必須です。");
        }
        validateBillStatus(request.getBillStatus());

        Order order = orderRepository.findByCustomerId(customerId)
                .filter(o -> o.getStatus() != Order.Status.CANCELLED)
                .orElseThrow(() -> new PosApiException(
                        404, "NOT_FOUND", "指定された客番号の注文が見つかりません。"));

        // hash が渡された場合のみ同一性を検証する
        if (request.getHash() != null) {
            String currentHash = PosHashUtil.computeHash(order);
            if (!currentHash.equals(request.getHash())) {
                throw new PosApiException(
                        409, "HASH_MISMATCH", "注文内容が変更されています。再取得してください。");
            }
        }

        order.setBillStatus(request.getBillStatus());
        orderRepository.save(order);
    }

    // ── バリデーション・変換ヘルパー ─────────────────────────────

    private String normalizeCustomerId(String customerId) {
        if (customerId == null) {
            return null;
        }
        String trimmed = customerId.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (!CUSTOMER_ID_PATTERN.matcher(trimmed).matches()) {
            throw new PosApiException(400, "INVALID_REQUEST", "customerId は7桁数字で指定してください。");
        }
        return trimmed;
    }

    private void validateHashNullable(String hash) {
        if (hash == null) {
            return;
        }
        if (!HASH_PATTERN.matcher(hash).matches()) {
            throw new PosApiException(400, "INVALID_REQUEST", "hash の形式が不正です。");
        }
    }

    private void validateBillStatusNullable(Integer billStatus) {
        if (billStatus == null) {
            return;
        }
        validateBillStatus(billStatus);
    }

    private void validateBillStatus(int billStatus) {
        if (billStatus < 1 || billStatus > BILL_STATUS_MAX) {
            throw new PosApiException(400, "INVALID_REQUEST", "billStatus は1〜15で指定してください。");
        }
    }

    private LocalDateTime parseIsoNullable(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value.trim(), ISO);
        } catch (DateTimeParseException e) {
            throw new PosApiException(400, "INVALID_REQUEST", fieldName + " はISO8601形式で指定してください。");
        }
    }
}
