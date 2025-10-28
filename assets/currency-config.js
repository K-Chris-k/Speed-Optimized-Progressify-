/**
 * Currency Configuration and Conversion Utilities
 * Handles multi-currency support for free shipping thresholds
 */

// 货币转换配置
window.currencyConfig = {
  // 基准货币 - 所有免运费阈值都基于此货币
  baseCurrency: 'USD',
  
  // 免运费阈值 (美元) - 将从Shopify设置中获取
  freeShippingThresholdUSD: 100, // 默认值，会被Liquid模板覆盖
  
  // 记录货币配置启动
  debug: function() {
    // Debug function disabled to prevent console logging
    if (typeof Shopify !== 'undefined' && Shopify.currency) {
      // Debug info available but not logged
    }
  },
  
  // 货币汇率表 (相对于USD) - 2024年6月更新
  currencyRates: {
    'USD': 1.0,
    'EUR': 0.9258,
    'GBP': 0.7874,
    'CAD': 1.3698,
    'AUD': 1.5152,
    'JPY': 157.63,
    'CNY': 7.2464,
    'HKD': 7.81,
    'SGD': 1.34,
    'NZD': 1.64,
    'CHF': 0.90,
    'SEK': 10.45,
    'NOK': 10.60,
    'DKK': 6.91,
    'INR': 83.35,
    'MXN': 16.73,
    'BRL': 5.42,
    'ZAR': 18.30,
    'AED': 3.67,
    'SAR': 3.75,
    'PLN': 3.95,
    'RUB': 88.25,
    'TRY': 32.17,
    'ALL': 84.937,  // 阿尔巴尼亚列克 - 特殊处理
    'AZN': 1.7,
    'MYR': 4.63,     // 马来西亚林吉特 (修正RM)
    'BAM': 1.82,     // 波斯尼亚马克 (修正KM)
    'DZD': 134.5,    // 阿尔及利亚第纳尔
    'MAD': 10.0,     // 摩洛哥迪拉姆
    'EGP': 47.5,     // 埃及镑
    'TND': 3.12,     // 突尼斯第纳尔
    'PKR': 278.0,    // 巴基斯坦卢比
    'BDT': 117.0,    // 孟加拉塔卡
    'NPR': 133.0,    // 尼泊尔卢比
    'LKR': 305.0,    // 斯里兰卡卢比
    'VND': 25400.0,  // 越南盾
    'THB': 36.5,     // 泰铢
    'IDR': 16000.0,  // 印尼卢比
    'KRW': 1370.0,   // 韩元
    'ILS': 3.65,     // 以色列新谢克尔
    'KZT': 446.0,    // 哈萨克坚戈
    'UAH': 39.0,     // 乌克兰格里夫纳
    'CZK': 23.0,     // 捷克克朗
    'HUF': 364.0,    // 匈牙利福林
    'RON': 4.6,      // 罗马尼亚列伊
    'CLP': 918.0,    // 智利比索
    'COP': 3900.0,   // 哥伦比亚比索
    'ARS': 910.0,    // 阿根廷比索
    'PEN': 3.7,      // 秘鲁索尔
    'UYU': 39.0,     // 乌拉圭比索
    'BOB': 6.91,     // 玻利维亚诺
    'PYG': 7410.0,   // 巴拉圭瓜拉尼
    'm': 1.0         // 默认
  },
  
  // 货币符号映射 - 使用ISO货币代码作为键
  currencySymbols: {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CNY': '¥',
    'HKD': 'HK$',
    'SGD': 'S$',
    'NZD': 'NZ$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'INR': '₹',
    'MXN': 'Mex$',
    'BRL': 'R$',
    'ZAR': 'R',
    'AED': 'د.إ',
    'SAR': '﷼',
    'PLN': 'zł',
    'RUB': '₽',
    'TRY': '₺',
    'ALL': 'Lek',
    'AZN': '₼',
    'MYR': 'RM',      // 马来西亚林吉特
    'BAM': 'KM',      // 波斯尼亚马克
    'DZD': 'DA',
    'MAD': 'DH',
    'EGP': 'E£',
    'TND': 'DT',
    'PKR': '₨',
    'BDT': '৳',
    'NPR': '₨',
    'LKR': 'Rs',
    'VND': '₫',
    'THB': '฿',
    'IDR': 'Rp',
    'KRW': '₩',
    'ILS': '₪',
    'KZT': '₸',
    'UAH': '₴',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RON': 'lei',
    'CLP': 'CLP$',
    'COP': 'COL$',
    'ARS': 'AR$',
    'PEN': 'S/',
    'UYU': '$U',
    'BOB': 'Bs',
    'PYG': '₲',
    'm': 'm.'
  },

  // 获取当前货币代码
  getCurrentCurrency: function() {
    // 首先尝试从配置数据中获取
    const configData = this.getConfigData();
    if (configData && configData.currentCurrency) {
      return configData.currentCurrency;
    }
    
    if (typeof Shopify !== 'undefined' && Shopify.currency && Shopify.currency.active) {
      return Shopify.currency.active;
    }
    
    // 从页面元素中尝试获取
    const priceElement = document.querySelector('[data-currency-code]');
    if (priceElement) {
      return priceElement.getAttribute('data-currency-code');
    }
    
    // 默认返回USD
    return 'USD';
  },

  // 从页面获取配置数据
  getConfigData: function() {
    const configElement = document.getElementById('currency-config-data');
    if (configElement) {
      try {
        return JSON.parse(configElement.textContent);
      } catch (e) {
        console.warn('Failed to parse currency config data:', e);
      }
    }
    return null;
  },

  // 将任意货币转换为USD (以分为单位)
  convertToUSD: function(amountInCents, fromCurrency) {
    if (!fromCurrency || fromCurrency === 'USD') {
      return amountInCents;
    }
    
    const rate = this.currencyRates[fromCurrency];
    if (!rate) {
      console.warn(`Currency rate not found for ${fromCurrency}, using USD rate`);
      return amountInCents;
    }
    
    // 转换为USD分
    return Math.round(amountInCents / rate);
  },

  // 将USD转换为指定货币 (以分为单位)
  convertFromUSD: function(usdAmountInCents, toCurrency) {
    if (!toCurrency || toCurrency === 'USD') {
      return usdAmountInCents;
    }
    
    const rate = this.currencyRates[toCurrency];
    if (!rate) {
      console.warn(`Currency rate not found for ${toCurrency}, using USD rate`);
      return usdAmountInCents;
    }
    
    // 从USD转换为目标货币分
    return Math.round(usdAmountInCents * rate);
  },

  // 获取免邮门槛 (当前货币，以分为单位)
  getFreeShippingThreshold: function(currency) {
    currency = currency || this.getCurrentCurrency();
    const thresholdUSDCents = this.freeShippingThresholdUSD * 100; // 转换为分
    return this.convertFromUSD(thresholdUSDCents, currency);
  },

  // 计算免邮进度
  calculateShippingProgress: function(cartTotalInCents, currency) {
    currency = currency || this.getCurrentCurrency();
    
    // 将购物车金额转换为USD
    const cartTotalUSD = this.convertToUSD(cartTotalInCents, currency);
    const thresholdUSD = this.freeShippingThresholdUSD * 100; // USD分
    
    // 计算进度百分比
    const progressPercentage = Math.min((cartTotalUSD / thresholdUSD) * 100, 100);
    
    // 计算还需要的金额 (USD)
    const remainingUSD = Math.max(thresholdUSD - cartTotalUSD, 0);
    
    // 将剩余金额转换回当前货币
    const remainingInCurrentCurrency = this.convertFromUSD(remainingUSD, currency);
    
    return {
      progressPercentage: progressPercentage,
      isEligible: cartTotalUSD >= thresholdUSD,
      remainingAmount: remainingInCurrentCurrency,
      currency: currency,
      cartTotalUSD: cartTotalUSD,
      thresholdUSD: thresholdUSD
    };
  },

  // 格式化货币显示
  formatCurrency: function(amountInCents, currency) {
    currency = currency || this.getCurrentCurrency();
    const symbol = this.currencySymbols[currency] || currency;
    const amount = amountInCents / 100;
    
    // 特殊处理某些货币的小数位
    let decimals = 2;
    if (['JPY', 'KRW', 'VND', 'IDR', 'PYG', 'CLP'].includes(currency)) {
      decimals = 0;
    }
    
    // 阿尔巴尼亚列克特殊处理 - 符号在后面，使用逗号作为千位分隔符
    if (currency === 'ALL') {
      const formattedAmount = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${formattedAmount} ${symbol}`;
    }
    
    // 其他特殊格式处理
    const formattedAmount = amount.toFixed(decimals);
    
    // 某些货币符号在后面
    if (['SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON'].includes(currency)) {
      return `${formattedAmount} ${symbol}`;
    }
    
    return `${symbol}${formattedAmount}`;
  },

  // 初始化配置
  init: function(thresholdUSD) {
    // 从页面配置数据中获取阈值
    const configData = this.getConfigData();
    if (configData && configData.freeShippingThresholdUSD) {
      this.freeShippingThresholdUSD = configData.freeShippingThresholdUSD;
    } else if (thresholdUSD) {
      this.freeShippingThresholdUSD = thresholdUSD;
    }
    this.debug();
  }
};

// 自动初始化
if (typeof window !== 'undefined') {
  window.currencyConfig.init();
}
