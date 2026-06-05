/**
 * G-Builder OS · AntD 主题 Token
 * 按 g-builder-os-interaction-spec.md §1 视觉规范
 */

export const gbTheme = {
  token: {
    colorPrimary: '#1A4D8F',
    colorLink: '#2E7BD6',
    colorLinkHover: '#1A4D8F',
    colorSuccess: '#10A86A',
    colorWarning: '#E59B26',
    colorError: '#D32F2F',
    colorInfo: '#2E7BD6',

    colorBgLayout: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',
    colorText: '#1F2937',
    colorTextSecondary: '#6B7280',
    colorTextTertiary: '#94A3B8',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontSize: 14,
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",

    controlHeight: 36,
    controlHeightSM: 28,
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultBorderColor: '#E2E8F0',
    },
    Menu: {
      itemSelectedColor: '#1A4D8F',
      itemSelectedBg: '#EBF3FB',
      itemActiveBg: '#F8FAFC',
      itemHoverBg: '#F8FAFC',
    },
    Tabs: {
      inkBarColor: '#1A4D8F',
      itemSelectedColor: '#1A4D8F',
      itemActiveColor: '#1A4D8F',
      itemHoverColor: '#2E7BD6',
    },
    Card: {
      borderRadiusLG: 12,
      headerHeight: 56,
    },
    Table: {
      headerBg: '#F0F4F8',
      headerColor: '#1F2937',
      rowHoverBg: '#F8FAFC',
    },
    Tag: {
      borderRadiusSM: 6,
    },
  },
}
