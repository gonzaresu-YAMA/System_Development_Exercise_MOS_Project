package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Order;
import com.midori.mos_backend.dto.OrderItemRequest;
import com.midori.mos_backend.dto.OrderRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OrderServiceTest {

    @Autowired
    private OrderService orderService;

    private OrderRequest buildRequest(Long seatId, String course, Long menuItemId, String name, int price) {
        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(menuItemId);
        item.setItemName(name);
        item.setUnitPrice(price);
        item.setQuantity(2);

        OrderRequest req = new OrderRequest();
        req.setSeatId(seatId);
        req.setCourseType(course);
        req.setItems(List.of(item));
        return req;
    }

    @Test
    @DisplayName("注文を作成できる")
    void createOrder_success() {
        OrderRequest req = buildRequest(1L, "normal", 1L, "ねぎま", 180);

        Order order = orderService.createOrder(req);

        assertThat(order.getId()).isNotNull();
        assertThat(order.getStatus()).isEqualTo(Order.Status.PENDING);
        assertThat(order.getTotalAmount()).isEqualTo(360); // 180 × 2
        assertThat(order.getItems()).hasSize(1);
        assertThat(order.getItems().get(0).getItemName()).isEqualTo("ねぎま");
        assertThat(order.getCourseType()).isEqualTo("normal");
    }

    @Test
    @DisplayName("複数アイテムを含む注文の合計金額が正しい")
    void createOrder_multipleItems_correctTotal() {
        OrderItemRequest item1 = new OrderItemRequest();
        item1.setMenuItemId(1L); item1.setItemName("ねぎま"); item1.setUnitPrice(180); item1.setQuantity(1);

        OrderItemRequest item2 = new OrderItemRequest();
        item2.setMenuItemId(2L); item2.setItemName("もも"); item2.setUnitPrice(180); item2.setQuantity(2);

        OrderRequest req = new OrderRequest();
        req.setSeatId(1L);
        req.setCourseType("normal");
        req.setItems(List.of(item1, item2));

        Order order = orderService.createOrder(req);

        assertThat(order.getTotalAmount()).isEqualTo(540); // 180 + 180×2
        assertThat(order.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("IDで注文を取得できる")
    void getOrderById_returnsOrder() {
        Order created = orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        Optional<Order> found = orderService.getOrderById(created.getId());

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(created.getId());
    }

    @Test
    @DisplayName("存在しないIDは空を返す")
    void getOrderById_notFound() {
        assertThat(orderService.getOrderById(9999L)).isEmpty();
    }

    @Test
    @DisplayName("注文ステータスを CONFIRMED に更新できる")
    void updateStatus_toConfirmed() {
        Order order = orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        Order updated = orderService.updateStatus(order.getId(), Order.Status.CONFIRMED);

        assertThat(updated.getStatus()).isEqualTo(Order.Status.CONFIRMED);
        assertThat(updated.getConfirmedAt()).isNotNull();
    }

    @Test
    @DisplayName("注文ステータスを COMPLETED に更新すると completedAt が設定される")
    void updateStatus_toCompleted_setsCompletedAt() {
        Order order = orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        Order updated = orderService.updateStatus(order.getId(), Order.Status.COMPLETED);

        assertThat(updated.getStatus()).isEqualTo(Order.Status.COMPLETED);
        assertThat(updated.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("存在しない注文のステータス更新は例外をスロー")
    void updateStatus_notFound_throwsException() {
        assertThatThrownBy(() -> orderService.updateStatus(9999L, Order.Status.CONFIRMED))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order not found");
    }

    @Test
    @DisplayName("座席IDで注文一覧を取得できる")
    void getOrdersBySeat_returnsOrders() {
        orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        orderService.createOrder(buildRequest(1L, "drink-2h", 2L, "もも", 180));

        List<Order> orders = orderService.getOrdersBySeat(1L);

        assertThat(orders).hasSizeGreaterThanOrEqualTo(2);
        assertThat(orders).allMatch(o -> o.getSeat() != null && o.getSeat().getId() == 1L);
    }

    @Test
    @DisplayName("アクティブな注文（PENDING/CONFIRMED/COOKING/READY）だけ取得される")
    void getActiveOrders_onlyActiveStatuses() {
        Order order = orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        orderService.updateStatus(order.getId(), Order.Status.CANCELLED);

        Order activeOrder = orderService.createOrder(buildRequest(2L, "normal", 2L, "もも", 180));

        List<Order> active = orderService.getActiveOrders();

        assertThat(active).anyMatch(o -> o.getId().equals(activeOrder.getId()));
        assertThat(active).noneMatch(o -> o.getStatus() == Order.Status.CANCELLED);
        assertThat(active).noneMatch(o -> o.getStatus() == Order.Status.COMPLETED);
    }

    @Test
    @DisplayName("既存注文にアイテムを追加できる")
    void addItemsToOrder_updatesTotal() {
        Order order = orderService.createOrder(buildRequest(1L, "normal", 1L, "ねぎま", 180));
        int initialTotal = order.getTotalAmount();

        OrderItemRequest extra = new OrderItemRequest();
        extra.setMenuItemId(2L); extra.setItemName("もも"); extra.setUnitPrice(180); extra.setQuantity(1);
        Order updated = orderService.addItemsToOrder(order.getId(), List.of(extra));

        assertThat(updated.getTotalAmount()).isEqualTo(initialTotal + 180);
        assertThat(updated.getItems()).hasSizeGreaterThan(order.getItems().size());
    }
}
