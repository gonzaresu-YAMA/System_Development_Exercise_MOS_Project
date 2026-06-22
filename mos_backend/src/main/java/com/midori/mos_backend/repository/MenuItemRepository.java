package com.midori.mos_backend.repository;

import com.midori.mos_backend.Entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByCategoryIdOrderBySortOrderAsc(Long categoryId);

    List<MenuItem> findByCategoryNameOrderBySortOrderAsc(String categoryName);

    List<MenuItem> findBySoldOutFalseOrderBySortOrderAsc();

    List<MenuItem> findByNameContainingIgnoreCase(String keyword);

    List<MenuItem> findByPriceBetween(int minPrice, int maxPrice);
}
