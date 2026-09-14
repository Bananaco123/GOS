(() => {
  const registry = new WeakMap();
  let active = null;

  const fallbackWidth = (select) => {
    if (select.classList.contains('select-control')) return 156;
    if (select.classList.contains('dimension-select')) return 142;
    if (select.classList.contains('select')) return 118;
    if (select.matches('[data-page-size]')) return 72;
    return 120;
  };

  const measure = (select) => {
    const rect = select.getBoundingClientRect();
    const style = getComputedStyle(select);
    const width = rect.width || parseFloat(style.width) || fallbackWidth(select);
    const height = rect.height || parseFloat(style.height) || 36;
    return {
      width: Math.max(64, Math.round(width)),
      height: Math.max(28, Math.round(height))
    };
  };

  const renderOptionContent = (container, option) => {
    const primaryText = option ? option.textContent.trim() : '';
    const secondaryText = option?.dataset.secondary?.trim() || '';
    const isTrigger = container.classList.contains('gos-dashboard-select__value');
    const primary = document.createElement('span');
    primary.className = isTrigger
      ? 'gos-dashboard-select__primary'
      : 'gos-dashboard-select-menu__option-primary';
    primary.textContent = primaryText;

    const children = [primary];
    if (secondaryText) {
      const secondary = document.createElement('span');
      secondary.className = isTrigger
        ? 'gos-dashboard-select__secondary'
        : 'gos-dashboard-select-menu__option-secondary';
      secondary.textContent = secondaryText;
      children.push(secondary);
    }
    container.replaceChildren(...children);
    container.classList.toggle('has-secondary', Boolean(secondaryText));
    return { primaryText, secondaryText };
  };

  const sync = (select) => {
    const state = registry.get(select);
    if (!state) return;
    const option = select.options[select.selectedIndex];
    const { primaryText, secondaryText } = renderOptionContent(state.value, option);
    const placeholderIndex = [...select.options].findIndex((item) => item.dataset.placeholder === 'true');
    const canClear = placeholderIndex >= 0 && select.selectedIndex !== placeholderIndex && !select.disabled;
    state.trigger.disabled = select.disabled;
    state.wrapper.classList.toggle('has-clear', canClear);
    state.clear.hidden = !canClear;
    state.trigger.setAttribute('aria-label', select.getAttribute('aria-label') || [primaryText, secondaryText].filter(Boolean).join('，') || '选择');
  };

  const close = (returnFocus = false) => {
    if (!active) return;
    const { menu, state } = active;
    menu.remove();
    state.trigger.classList.remove('is-open');
    state.trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) state.trigger.focus();
    active = null;
  };

  const positionMenu = () => {
    if (!active) return;
    const { menu, state, select } = active;
    const rect = state.trigger.getBoundingClientRect();
    const margin = 8;
    const gap = 6;
    const menuHeight = Math.min(menu.scrollHeight, 320);
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const openAbove = roomBelow < Math.min(menuHeight, 180) && rect.top > roomBelow;
    const requestedWidth = Number.parseFloat(select.dataset.menuWidth || '0');
    const width = Math.max(rect.width, Number.isFinite(requestedWidth) ? requestedWidth : 0, 138);
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    const top = openAbove
      ? Math.max(margin, rect.top - menuHeight - gap)
      : Math.min(window.innerHeight - menuHeight - margin, rect.bottom + gap);
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.width = `${Math.round(width)}px`;
    menu.classList.toggle('is-above', openAbove);
  };

  const focusOption = (menu, index) => {
    const options = [...menu.querySelectorAll('.gos-dashboard-select-menu__option:not(:disabled)')];
    if (!options.length) return;
    const safeIndex = Math.max(0, Math.min(index, options.length - 1));
    options[safeIndex].focus();
  };

  const selectOption = (select, index) => {
    if (select.options[index]?.disabled) return;
    select.selectedIndex = index;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    sync(select);
    close(true);
  };

  const clearSelection = (select) => {
    const placeholderIndex = [...select.options].findIndex((option) => option.dataset.placeholder === 'true');
    if (placeholderIndex < 0) return;
    select.selectedIndex = placeholderIndex;
    select.dispatchEvent(new Event('input', { bubbles: true }));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    sync(select);
    close(true);
  };

  const open = (select, focusSelected = false) => {
    const state = registry.get(select);
    if (!state || select.disabled) return;
    if (active?.select === select) {
      close();
      return;
    }
    close();
    sync(select);

    const menu = document.createElement('div');
    menu.className = 'gos-dashboard-select-menu';
    if (state.compact) menu.classList.add('gos-dashboard-select-menu--compact');
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', select.getAttribute('aria-label') || '选择');

    [...select.options].forEach((option, index) => {
      if (option.dataset.placeholder === 'true') return;
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'gos-dashboard-select-menu__option';
      renderOptionContent(item, option);
      item.disabled = option.disabled;
      item.dataset.optionIndex = String(index);
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
      if (option.selected) item.classList.add('is-selected');
      item.addEventListener('click', () => selectOption(select, index));
      menu.appendChild(item);
    });

    menu.addEventListener('keydown', (event) => {
      const options = [...menu.querySelectorAll('.gos-dashboard-select-menu__option:not(:disabled)')];
      const current = options.indexOf(document.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusOption(menu, current < 0 ? 0 : Math.min(current + 1, options.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusOption(menu, current < 0 ? options.length - 1 : Math.max(current - 1, 0));
      } else if (event.key === 'Home') {
        event.preventDefault();
        focusOption(menu, 0);
      } else if (event.key === 'End') {
        event.preventDefault();
        focusOption(menu, options.length - 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    });

    document.body.appendChild(menu);
    active = { select, state, menu };
    state.trigger.classList.add('is-open');
    state.trigger.setAttribute('aria-expanded', 'true');
    positionMenu();
    if (focusSelected) {
      const selected = menu.querySelector('.is-selected');
      (selected || menu.querySelector('.gos-dashboard-select-menu__option:not(:disabled)'))?.focus();
    }
  };

  const enhance = (select) => {
    if (!(select instanceof HTMLSelectElement) || select.dataset.gosSelectReady === 'true' || select.dataset.nativeSelect === 'true') return;
    const size = measure(select);
    const wrapper = document.createElement('span');
    wrapper.className = 'gos-dashboard-select';
    const compact = select.classList.contains('dimension-select') || select.matches('[data-page-size]');
    if (compact) wrapper.classList.add('gos-dashboard-select--compact');
    wrapper.style.setProperty('--gos-select-width', `${size.width}px`);
    wrapper.style.setProperty('--gos-select-height', `${size.height}px`);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'gos-dashboard-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const value = document.createElement('span');
    value.className = 'gos-dashboard-select__value';
    const clear = document.createElement('span');
    clear.className = 'gos-dashboard-select__clear';
    clear.setAttribute('role', 'button');
    clear.setAttribute('aria-label', '清除所选项');
    clear.title = '清除所选项';
    clear.textContent = '×';
    clear.hidden = true;
    const chevron = document.createElement('span');
    chevron.className = 'gos-dashboard-select__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(value, clear, chevron);

    select.parentNode.insertBefore(wrapper, select);
    wrapper.append(select, trigger);
    select.classList.add('gos-dashboard-select__native');
    select.dataset.gosSelectReady = 'true';
    select.tabIndex = -1;
    registry.set(select, { wrapper, trigger, value, clear, compact });
    sync(select);

    trigger.addEventListener('pointerdown', () => sync(select));
    trigger.addEventListener('click', () => open(select));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(select, true);
      } else if (event.key === 'Escape') {
        close();
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && !clear.hidden) {
        event.preventDefault();
        clearSelection(select);
      }
    });
    clear.addEventListener('pointerdown', (event) => event.stopPropagation());
    clear.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      clearSelection(select);
    });
    select.addEventListener('change', () => sync(select));
  };

  const enhanceWithin = (root = document) => {
    if (root instanceof HTMLSelectElement) enhance(root);
    root.querySelectorAll?.('select').forEach(enhance);
  };

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) enhanceWithin(node);
        });
        if (mutation.target instanceof HTMLSelectElement) sync(mutation.target);
      } else if (mutation.type === 'attributes' && mutation.target instanceof HTMLSelectElement) {
        sync(mutation.target);
      }
    });
  });

  document.addEventListener('pointerdown', (event) => {
    if (!active) return;
    if (active.menu.contains(event.target) || active.state.trigger.contains(event.target)) return;
    close();
  }, true);
  document.addEventListener('focusin', (event) => {
    if (event.target instanceof HTMLSelectElement) sync(event.target);
  });
  window.addEventListener('resize', positionMenu);
  window.addEventListener('scroll', positionMenu, true);

  enhanceWithin(document);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled']
  });

  window.GOSDashboardSelect = {
    enhanceAll: () => enhanceWithin(document),
    sync,
    syncAll: () => document.querySelectorAll('select').forEach(sync),
    close
  };
})();
