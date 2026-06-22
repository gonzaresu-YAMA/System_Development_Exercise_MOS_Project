package com.midori.mos_backend.service;

import com.midori.mos_backend.Entity.Staff;
import com.midori.mos_backend.repository.StaffRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StaffService {

    private final StaffRepository staffRepository;

    public StaffService(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    @Transactional(readOnly = true)
    public List<Staff> getAll() {
        return staffRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Staff> getById(String id) {
        return staffRepository.findByIdIgnoreCase(id);
    }

    public Staff create(Staff staff) {
        return staffRepository.save(staff);
    }

    public Staff update(String id, Staff patch) {
        Staff existing = staffRepository.findByIdIgnoreCase(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff not found: " + id));

        existing.setName(patch.getName());
        existing.setRole(patch.getRole());
        existing.setActive(patch.isActive());
        existing.setAllowedUseCases(patch.getAllowedUseCases());
        if (patch.getPassword() != null && !patch.getPassword().isBlank()) {
            existing.setPassword(patch.getPassword());
        }
        return staffRepository.save(existing);
    }

    public void delete(String id) {
        staffRepository.deleteById(id);
    }

    /** 認証: ID（大文字小文字無視）とパスワードを照合 */
    @Transactional(readOnly = true)
    public Optional<Staff> authenticate(String id, String password) {
        return staffRepository.findByIdIgnoreCase(id)
                .filter(s -> s.isActive() && s.getPassword().equals(password));
    }
}
