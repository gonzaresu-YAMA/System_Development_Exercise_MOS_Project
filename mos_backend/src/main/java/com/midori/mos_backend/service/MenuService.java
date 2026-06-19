package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Category;
import com.midori.mos_backend.Entity.MenuItem;
import com.midori.mos_backend.repository.CategoryRepository;
import com.midori.mos_backend.repository.MenuItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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

    public Optional<MenuItem> getItemById(Long id) {
        return menuItemRepository.findById(id);
    }

    public List<MenuItem> searchItems(String keyword) {
        return menuItemRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<MenuItem> getItemsByPriceRange(int minPrice, int maxPrice) {
        return menuItemRepository.findByPriceBetween(minPrice, maxPrice);
    }
}
