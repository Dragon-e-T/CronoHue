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
    chartData: [],
    scrollValue: 0,
    maxScrollValue: 100,
    allRecords: []
  },
  goToAddPage() {
    wx.navigateTo({
      url: '/pages/add/add' 
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
  onLoad() {
    this.updateDate();
    this.initChart();
    this.loadAllRecords();
  },

  onShow() {
    this.loadAllRecords();
    this.initChart();
  },

  formatDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
  },

  updateDate() {
    const now = new Date();
    this.setData({
      currentDate: `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`
    });
  },

  initChart() {
    const records = wx.getStorageSync('records') || [];
    this.processChartData(records);
  },

  processChartData(records) {
    const last7Days = this.getLast7DaysRecords(records);
    const dates = last7Days.map(item => {
      const dateObj = new Date(item.timestamp);
      return `${dateObj.getMonth()+1}/${dateObj.getDate()}`;
    });
    
    const values = last7Days.map(item => moodMap[item.mood] || 0);
    const avg = values.length > 0 
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : 0;
    
    this.setData({ 
      averageMood: avg,
      chartData: { dates, values }
    }, () => {
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

onScrollChange(e) {
  const startIndex = Math.floor(
    e.detail.value / 100 * this.data.maxScrollValue
  );
  this.updateChartData(startIndex);
},

  drawChart() {
    const ctx = wx.createCanvasContext('moodChart');
    const { dates, values } = this.data.chartData;
    
    ctx.clearRect(0, 0, 300, 250);
    
    // 绘制坐标轴
    ctx.setStrokeStyle('#D8BFD8');
    ctx.setLineWidth(1);
    ctx.moveTo(30, 30);
    ctx.lineTo(30, 230);
    ctx.lineTo(310, 230);
    ctx.stroke();

    if (this.data.chartType === 'line') {
      this.drawLineChart(ctx, dates, values);
    } else {
      this.drawBarChart(ctx, dates, values);
    }
    
    ctx.draw();
  },

  drawLineChart(ctx, dates, values) {
    const chartWidth = 280;
    const chartHeight = 200;
    const stepX = chartWidth / (dates.length - 1);
    const stepY = chartHeight / 5;

    ctx.setStrokeStyle('#6A5ACD');
    ctx.setLineWidth(2);
    ctx.beginPath();
    
    dates.forEach((date, index) => {
      const x = 30 + index * stepX;
      const y = 230 - (values[index] * stepY);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      // 绘制数据点
      ctx.setFillStyle('#D8BFD8');
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.stroke();
  },

  drawBarChart(ctx, dates, values) {
    const chartWidth = 280;
    const chartHeight = 200;
    const barWidth = 20;
    const gap = (chartWidth - dates.length * barWidth) / (dates.length + 1);
    const stepY = chartHeight / 5;

    dates.forEach((date, index) => {
      const x = 30 + (index + 1) * gap + index * barWidth;
      const height = values[index] * stepY;
      
      ctx.setFillStyle('rgba(216, 191, 216, 0.8)');
      ctx.fillRect(x, 230 - height, barWidth, height);
    });
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
    });
    this.processChartData(records.slice(0, 7));
  },
  
  
})
