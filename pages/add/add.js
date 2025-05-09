Page({
    data: {
      currentDate: '',
      content: '',
      selectedMood: null,
      moods: ['😊', '😐', '😡', '😍', '🥲']
    },
  
    onLoad() {
      this.setData({
        currentDate: this.formatDate(new Date())
      });
    },
  
    formatDate(date) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    },
  
    onContentChange(e) {
      this.setData({ content: e.detail.value });
    },
  
    selectMood(e) {
      this.setData({ selectedMood: e.currentTarget.dataset.mood });
    },
  
    saveRecord() {    
      const record = {
      date: this.data.currentDate,
      content: this.data.content,
      mood: this.data.selectedMood,
      timestamp: Date.now()
    };
  
      // 获取已有记录或初始化
      const records = wx.getStorageSync('records') || [];
      records.unshift(record); // 新记录添加到开头
      
      wx.setStorageSync('records', records);
      wx.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 1500,
        complete: () => {
          // 获取首页页面实例并刷新图表
          const pages = getCurrentPages();
          if (pages.length > 1) {
            const indexPage = pages[0];
            if (indexPage.route === 'pages/index/index') {
              indexPage.initChart();
            }
          }
        }
      });

     // 清空表单，准备下一条记录
  this.setData({
    content: '',
    selectedMood: null
  });
},

    navigateToHistory() {
        wx.navigateTo({
          url: '/pages/history/history'
        });
      }
  });