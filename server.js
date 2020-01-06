
const yapi =require('yapi.js');

const plan = require('./controllers/plan');
const result = require('./controllers/result');

const schedule = require('./schedule');
const Config = require('./utils/config');

module.exports = function(options){
  Config.instance = options;
  
  yapi.getInst(schedule);

  this.bindHook('add_router', function(addRouter){
    // 测试计划
    addRouter({
      controller: plan,
      method: 'get',
      path: 'test/plan',
      action: 'getTestPlans'
    })
    addRouter({
      controller: plan,
      method: 'post',
      path: 'test/plan/add',
      action: 'saveTestPlan'
    })
    addRouter({
      controller: plan,
      method: 'put',
      path: 'test/plan/update',
      action: 'updateTestPlan'
    })
    addRouter({
      controller: plan,
      method: 'delete',
      path: 'test/plan/del',
      action: 'delTestPlan'
    })

    // 测试结果
    addRouter({
      controller: result,
      prefix: "/open",
      method: 'get',
      path: 'test/run',
      action: 'runAutoTest'
    })
    addRouter({
      controller: result,
      method: 'get',
      path: 'test/results',
      action: 'getTestResults'
    })
    addRouter({
      controller: result,
      method: 'delete',
      path: 'test/results/del',
      action: 'delTestResults'
    })
    addRouter({
      controller: result,
      prefix: "/open",
      method: 'get',
      path: 'test/result',
      action: 'getTestResult'
    })
  })

}