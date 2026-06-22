package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.dto.MenuItemRequest;
import com.midori.mos_backend.repository.CategoryRepository;
import com.midori.mos_backend.repository.MenuItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    public MenuService(CategoryRepository categoryRepository, MenuItemRepository menuItemRepository) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc();
    }

    public List<MenuItem> getItemsByCategory(String categoryName) {
        return menuItemRepository.findByCategoryNameOrderBySortOrderAsc(categoryName);
    }

    public List<MenuItem> getAllAvailableItems() {
        return menuItemRepository.findBySoldOutFalseOrderBySortOrderAsc();
    }

    public List<MenuItem> getAllItems() {
        return menuItemRepository.findAll();
    }

    public Optional<MenuItem> getItemById(Long id) {
        return menuItemRepository.findById(id);
    }

    public List<MenuItem> searchItems(String keyword) {
        return menuItemRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<MenuItem> getItemsByPriceRange(int minPrice, int maxPrice) {
        return menuItemRepository.findByPriceBetween(minPrice, maxPrice);
    }

    /** 全メニューに付いているタグ名の重複なし一覧を返す */
    public List<String> getAllTags() {
        return menuItemRepository.findAll().stream()
                .map(MenuItem::getTags)
                .filter(t -> t != null && !t.isBlank())
                .flatMap(t -> Arrays.stream(t.split(",")))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Transactional
    public MenuItem createItem(MenuItemRequest req) {
        MenuItem item = new MenuItem();
        applyRequest(item, req);
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem updateItem(Long id, MenuItemRequest req) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("MenuItem not found: " + id));
        applyRequest(item, req);
        return menuItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        menuItemRepository.deleteById(id);
    }

    private void applyRequest(MenuItem item, MenuItemRequest req) {
        item.setName(req.getName());
        item.setPrice(req.getPrice());
        item.setStock(req.getStock());
        item.setActive(req.isActive());
        // stock が 0 なら売り切れ扱い
        item.setSoldOut(req.getStock() != null && req.getStock() == 0);

        List<String> tags = req.getTags();
        item.setTags(tags != null ? String.join(",", tags) : "");

        // categoryId が指定されていれば設定（省略時は既存を維持 or デフォルトカテゴリ）
        if (req.getCategoryId() != null) {
            categoryRepository.findById(req.getCategoryId())
                    .ifPresent(item::setCategory);
        } else if (item.getCategory() == null) {
            // デフォルト: sort_order が最小のカテゴリを使用
            categoryRepository.findAllByOrderBySortOrderAsc().stream()
                    .findFirst()
                    .ifPresent(item::setCategory);
        }
    }
}
