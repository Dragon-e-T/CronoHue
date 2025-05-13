// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const moodMap = {
  '😍': 5,
  '😊': 4,
  '😐': 3,
  '🥲': 2,
  '😢': 1,
  '😡': 0
};

const moodEmojiMap = {
  5: '😍',
  4: '😊',
  3: '😐',
  2: '🥲',
  1: '😢',
  0: '😡'
};


Page({
  data: {
    motto: 'Hello World',
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    currentDate: '',
    chartType: 'line',
    averageMood: 0,
    chartData: { times: [], values: [] },
    scrollValue: 0,
    maxScrollValue: 100,
    allRecords: [],
    hoverInfo: null,
    hoverPosition: { top: 0, left: 0 },
    hoverIndex: -1,
    selectedDate: '',
    points: []
  },

  onLoad() {
    const today = new Date();
    const formattedToday = this.formatDate(today);
    this.setData({
      selectedDate: formattedToday
    }, () => {
      this.initChart();
    });
  },

  goToAddPage() {
    wx.navigateTo({
      url: '/pages/add/add',
      fail: (err) => {
        console.error('导航失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },

  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },

  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  onShow() {
    this.loadAllRecords();
    this.initChart();
  },

  setToday() {
    const today = new Date();
    const formattedToday = this.formatDate(today);
    this.setData({ 
      selectedDate: formattedToday
    });
    return formattedToday;
  },

  formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  initChart() {
    const records = wx.getStorageSync('records') || [];
    this.processChartData(records);
  },

  processChartData(records) {
    const targetDate = this.data.selectedDate;
    console.log('当前选择的日期:', targetDate);
    console.log('所有记录:', records);
    
    // 按日期分组记录
    const dayRecords = records.filter(record => {
      const recordDate = this.formatDate(new Date(record.timestamp));
      const matches = recordDate === targetDate;
      console.log('记录日期:', recordDate, '目标日期:', targetDate, '是否匹配:', matches);
      return matches;
    });
    
    console.log('筛选后的记录:', dayRecords);
    
    // 按时间排序
    dayRecords.sort((a, b) => a.timestamp - b.timestamp);
    
    // 提取时间和心情值
    const times = dayRecords.map(item => {
      const date = new Date(item.timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    const values = dayRecords.map(item => {
      const moodValue = moodMap[item.mood];
      console.log('心情值转换:', item.mood, '->', moodValue);
      return moodValue || 0;
    });
    
    console.log('处理后的数据:', { times, values });
    
    // 计算当日平均心情
    const avg = values.length > 0 
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : 0;
    
    this.setData({ 
      chartData: { times, values },
      averageMood: avg
    }, () => {
      console.log('准备绘制图表，数据:', this.data.chartData);
      this.drawChart();
    });
  },

  saveMood() {
    if (!this.data.selectedMood) return;
    
    const moodRecord = {
        date: new Date().toISOString().split('T')[0],
        mood: this.data.selectedMood,
        note: this.data.moodNote,
        timestamp: Date.now()
    };
    
    const records = wx.getStorageSync('records') || [];
    records.unshift(moodRecord);
    wx.setStorageSync('records', records);
    
    wx.showToast({
        title: '心情已保存',
        icon: 'success',
        complete: () => {
            // 保存成功后刷新所有数据和图表
            this.loadAllRecords();
            this.drawChart();
        }
    });
    
    this.setData({ 
        selectedMood: null,
        moodNote: '' 
    });
  },

  updateChartData(startIndex) {
    const visibleRecords = this.data.allRecords.slice(startIndex, startIndex + 7);
    const dates = visibleRecords.map(r => this.formatDate(new Date(r.timestamp)));
    const values = visibleRecords.map(r => moodMap[r.mood] || 0);
    const avg = values.length ? (values.reduce((a,b) => a+b, 0)/values.length).toFixed(1) : 0;
    
    this.setData({ averageMood: avg });
    this.drawChart(dates, values);
  },

  onDateChange(e) {
    const selectedDate = e.detail.value;
    const today = this.formatDate(new Date());
    
    if (selectedDate > today) {
      wx.showToast({
        title: '不能选择未来日期',
        icon: 'none'
      });
      return;
    }
    
    console.log('日期选择变化:', selectedDate);
    this.setData({ selectedDate }, () => {
      const records = wx.getStorageSync('records') || [];
      this.processChartData(records);
    });
  },

  showPreviousDay() {
    const currentDate = new Date(this.data.selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = this.formatDate(currentDate);
    
    console.log('切换到前一天:', previousDate);
    
    this.setData({ selectedDate: previousDate }, () => {
      const records = wx.getStorageSync('records') || [];
      this.processChartData(records);
    });
  },

  showNextDay() {
    const currentDate = new Date(this.data.selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = this.formatDate(currentDate);
    const today = this.formatDate(new Date());
    
    if (nextDate > today) {
      wx.showToast({
        title: '不能查看未来日期',
        icon: 'none'
      });
      return;
    }
    
    console.log('切换到后一天:', nextDate);
    this.setData({ selectedDate: nextDate }, () => {
      const records = wx.getStorageSync('records') || [];
      this.processChartData(records);
    });
  },

  showToday() {
    const today = this.formatDate(new Date());
    console.log('返回今天:', today);
    this.setData({ selectedDate: today }, () => {
      const records = wx.getStorageSync('records') || [];
      this.processChartData(records);
    });
  },

  handleTouchStart(e) {
    const query = wx.createSelectorQuery();
    query.select('.chart').boundingClientRect(rect => {
      if (!rect) return;
      
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      const points = this.data.points || [];
      let hitIndex = -1;
      
      points.forEach((point, index) => {
        const distance = Math.sqrt(
          Math.pow(x - point.x, 2) + 
          Math.pow(y - point.y, 2)
        );
        
        if (distance <= 15) {
          hitIndex = index;
        }
      });
      
      if (hitIndex !== -1) {
        const point = points[hitIndex];
        this.setData({
          hoverIndex: hitIndex,
          hoverInfo: {
            time: point.time,
            score: point.value,
            emoji: point.emoji,
            date: this.data.selectedDate
          },
          hoverPosition: {
            top: touch.clientY - 60,
            left: touch.clientX - 50
          }
        }, () => {
          this.drawChart();
        });
      }
    }).exec();
  },

  drawChart() {
    const ctx = wx.createCanvasContext('moodChart');
    const { times, values } = this.data.chartData;
    
    console.log('开始绘制图表:', { times, values });
    
    // 设置图表区域
    const canvasWidth = 300; // 画布总宽度
    const chartWidth = 280;
    const chartHeight = 200;
    const padding = { 
      top: 30, 
      right: 30, 
      bottom: 50, 
      left: 40 
    };

    // 计算图表的水平居中位置
    const startX = (canvasWidth - (chartWidth + padding.left + padding.right)) / 2 + padding.left;
    
    ctx.clearRect(0, 0, canvasWidth, 250);
    
    // 绘制坐标轴
    ctx.setStrokeStyle('#D8BFD8');
    ctx.setLineWidth(1);
    ctx.moveTo(startX, padding.top);
    ctx.lineTo(startX, chartHeight + padding.top);
    ctx.lineTo(startX + chartWidth, chartHeight + padding.top);
    ctx.stroke();

    // 绘制心情评分刻度
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight - (i * chartHeight / 5));
      ctx.setFillStyle('#9370DB');
      ctx.fillText(i.toString(), startX - 15, y + 5);
      
      // 绘制网格线
      ctx.setStrokeStyle('rgba(216, 191, 216, 0.2)');
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + chartWidth, y);
      ctx.stroke();
    }

    if (times.length > 0) {
      if (this.data.chartType === 'line') {
        // 为折线图绘制时间刻度
        ctx.setFontSize(10);
        ctx.setFillStyle('#9370DB');
        times.forEach((time, index) => {
          const x = startX + index * (chartWidth / (times.length - 1 || 1));
          ctx.save();
          ctx.translate(x, chartHeight + padding.top + 10);
          ctx.rotate(-Math.PI / 4);
          ctx.fillText(time, 0, 0);
          ctx.restore();
        });
        
        this.drawLineChart(ctx, times, values, padding, startX);
      } else {
        this.drawBarChart(ctx, times, values, padding, startX);
      }
    } else {
      // 如果没有数据，显示提示信息
      ctx.setFillStyle('#9370DB');
      ctx.setFontSize(14);
      ctx.fillText('暂无心情记录', startX + chartWidth/2 - 40, padding.top + chartHeight/2);
    }
    
    ctx.draw();
  },

  drawLineChart(ctx, dates, values, padding, startX) {
    const chartWidth = 280;
    const chartHeight = 200;
    
    // 计算步长
    const stepX = dates.length <= 1 ? chartWidth : chartWidth / (dates.length - 1);
    const stepY = chartHeight / 5;

    // 存储点位置信息
    const points = [];
    
    // 绘制折线
    ctx.beginPath();
    ctx.setStrokeStyle('#6A5ACD');
    ctx.setLineWidth(2);

    dates.forEach((date, index) => {
      const x = startX + (index * stepX);
      const y = padding.top + chartHeight - (values[index] * stepY);
      
      // 存储点位置
      points.push({
        x,
        y,
        time: date,
        value: values[index],
        emoji: moodEmojiMap[values[index]]
      });

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // 绘制折线
    ctx.stroke();
    
    // 绘制数据点
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.setFillStyle(this.data.hoverIndex === index ? '#6A5ACD' : '#D8BFD8');
      ctx.arc(point.x, point.y, this.data.hoverIndex === index ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 更新points数据
    this.data.points = points;
  },

  drawBarChart(ctx, dates, values, padding, startX) {
    const chartWidth = 280;
    const chartHeight = 200;
    const minGap = 10; // 最小间隔
    
    // 根据数据点数量动态计算柱宽
    const barWidth = Math.min(
      30, // 最大宽度
      (chartWidth - (dates.length + 1) * minGap) / dates.length // 动态计算宽度
    );
    
    // 计算实际间隔
    const gap = (chartWidth - dates.length * barWidth) / (dates.length + 1);
    const stepY = chartHeight / 5;

    // 重置points数组
    this.data.points = [];

    // 绘制柱状图和时间标签
    dates.forEach((time, index) => {
      const x = startX + (index + 1) * gap + index * barWidth;
      const height = values[index] * stepY;
      const y = padding.top + chartHeight - height;
      
      // 存储柱状图位置信息用于悬停检测
      this.data.points.push({ 
        x: x + barWidth/2, 
        y: y + height/2,
        time: time,
        value: values[index],
        emoji: moodEmojiMap[values[index]]
      });
      
      // 绘制柱状图
      ctx.setFillStyle(this.data.hoverIndex === index ? '#6A5ACD' : 'rgba(216, 191, 216, 0.8)');
      ctx.fillRect(x, y, barWidth, height);

      // 绘制时间标签
      ctx.save();
      ctx.setFontSize(10);
      ctx.setFillStyle('#9370DB');
      const timeX = x + barWidth/2;
      const timeY = padding.top + chartHeight + 20;
      ctx.textAlign = 'center';
      ctx.fillText(time, timeX, timeY);
      ctx.restore();
    });
  },

  handleTouchEnd() {
    this.setData({
      hoverIndex: -1,
      hoverInfo: null
    }, () => {
      this.drawChart();
    });
  },

  getCurrentRecords() {
    const startIndex = Math.floor(
      this.data.scrollValue / 100 * this.data.maxScrollValue
    );
    return this.data.allRecords.slice(startIndex, startIndex + 7);
  },

  switchChartType(e) {
    this.setData({ 
      chartType: e.currentTarget.dataset.type 
    }, () => {
      this.drawChart();
    });
  },

  getLast7DaysRecords(records) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return records
      .filter(r => new Date(r.timestamp) >= oneWeekAgo)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  loadAllRecords() {
    const records = wx.getStorageSync('records') || [];
    this.setData({
      allRecords: records,
      maxScrollValue: Math.max(records.length - 7, 0)
    }, () => {
      this.processChartData(records.slice(0, 7));
    });
  },
})
