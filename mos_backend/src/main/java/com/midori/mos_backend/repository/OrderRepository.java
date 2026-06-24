package com.midori.mos_backend.repository;

import com.midori.mos_backend.Entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 注文を管理するリポジトリインターフェース
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findBySeatId(Long seatId);

    List<Order> findByStatus(Order.Status status);

    List<Order> findByStatusIn(List<Order.Status> statuses);

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :startOfDay AND o.createdAt < :endOfDay ORDER BY o.createdAt DESC")
    List<Order> findTodayOrders(LocalDateTime startOfDay, LocalDateTime endOfDay);
}
