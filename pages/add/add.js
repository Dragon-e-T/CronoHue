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

    const records = wx.getStorageSync('records') || [];
    records.unshift(record);
    
    wx.setStorageSync('records', records);
    wx.showToast({
        title: '保存成功',
        icon: 'success',
        complete: () => {
            // 获取首页页面实例并刷新数据
            const pages = getCurrentPages();
            if (pages.length > 1) {
                const indexPage = pages[0];
                if (indexPage.route === 'pages/index/index') {
                    indexPage.loadAllRecords();
                    indexPage.drawChart();
                }
            }
        }
    });
    
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