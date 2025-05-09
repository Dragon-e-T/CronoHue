Page({
    data: {
      records: []
    },
  
    onLoad() {
      this.loadRecords();
    },
  
    loadRecords() {
      const records = wx.getStorageSync('records') || [];
      this.setData({ records });
    },
  
    getMoodColor(mood) {
      const moodColors = {
        '😊': '#D8BFD8',
        '😐': '#E6E6FA', 
        '😡': '#9370DB',
        '😍': '#FFB6C1',
        '🥲': '#DDA0DD'
      };
      return moodColors[mood] || '#E6E6FA';
    },
  
    onShow() {
      this.loadRecords();
    },

    navigateBack() {
        wx.navigateBack();
      }
  });