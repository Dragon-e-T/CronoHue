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
      if (!this.data.selectedMood || !this.data.content) {
        wx.showToast({
          title: '请选择心情和填写内容',
          icon: 'none'
        });
        return;
      }

      const timestamp = Date.now();
      const record = {
          date: this.data.currentDate,
          content: this.data.content,
          mood: this.data.selectedMood,
          timestamp: timestamp
      };

      console.log('准备保存记录:', record);

      const records = wx.getStorageSync('records') || [];
      records.unshift(record);
      
      try {
          wx.setStorageSync('records', records);
          console.log('记录保存成功');
          
          wx.showToast({
              title: '保存成功',
              icon: 'success',
              complete: () => {
                  // 获取首页页面实例并刷新数据
                  const pages = getCurrentPages();
                  const indexPage = pages[0];
                  if (indexPage && indexPage.route === 'pages/index/index') {
                      console.log('刷新首页数据');
                      indexPage.processChartData(records);
                  }
                  
                  // 返回首页
                  wx.navigateBack();
              }
          });
          
          this.setData({
              content: '',
              selectedMood: null
          });
      } catch (error) {
          console.error('保存记录失败:', error);
          wx.showToast({
              title: '保存失败，请重试',
              icon: 'none'
          });
      }
    },
  
    navigateToHistory() {
        wx.navigateTo({
          url: '/pages/history/history'
        });
      }
  });