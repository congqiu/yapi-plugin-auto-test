const yapi = require('yapi.js');
const baseModel = require('models/base.js');

class testPlanModel extends baseModel {
  getName() {
    return 'auto_test_plan';
  }

  getSchema() {
    return {
      uid: Number,
      // 项目id
      project_id: {
        type: Number,
        required: true
      },

      // 计划名称
      plan_name: {
        type: String,
        required: true
      },

      //是否开启自动测试
      is_plan_open: {
        type: Boolean,
        default: false
      },

      //自动测试定时任务的cron表达式
      plan_cron: String,

      //自动测试url
      plan_url: String,

      //保留多少次执行结果，为-1表示不限
      plan_result_size: {
        type: Number,
        default: 10
      },

      // 失败重试次数
      plan_fail_retries: {
        type: Number,
        default: 0
      },
      
      notifier: {
        target: String,
        url: String
      },

      // 废弃，保留兼容
      notice_trigger: {
        type: String,
        enum: ["never", "any", "fail", "success", "part"]
      },

      notice_triggers: {
        type: [String],
        enum: ["never", "any", "fail", "success", "part"],
        default: ["never"]
      },

      //上次执行时间
      last_test_time: {
        type: Number,
        default: null
      },

      add_time: Number,
      up_time: Number
    };
  }

  save(data) {
    data.add_time = yapi.commons.time();
    data.up_time = yapi.commons.time();
    let plan = new this.model(data);
    return plan.save();
  }

  listAll() {
    return this.model
      .find()
      .sort({ _id: -1 })
      .exec();
  }

  find(id) {
    return this.model.findOne({ _id: id });
  }

  findByName(name, project_id) {
    return this.model.findOne({ plan_name: name, project_id });
  }

  findByProject(id) {
    return this.model
      .find({
        project_id: id
      })
      .sort({ _id: -1 })
      .exec();
  }

  update(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.update(
      {
        _id: id
      },
      data
    );
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }
}

module.exports = testPlanModel;