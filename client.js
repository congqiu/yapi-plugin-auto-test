import AutoTestPage from './AutoTestPage';

module.exports = function() {
  this.bindHook('sub_nav', function(app) {
    app.autoTest = {
      name: '自动化测试',
      path: '/project/:id/auto_test',
      component: AutoTestPage
    }
  });
};