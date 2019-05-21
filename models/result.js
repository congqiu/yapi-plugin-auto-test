const yapi = require('yapi.js');
const baseModel = require('models/base.js');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

class testResultModel extends baseModel {
  getName() {
    return 'auto_test_result';
  }

  getSchema() {
    return {
      uid: Number,
      project_id: {
        type: Number,
        required: true
      },
      // 通过测试计划执行才有，没有则为-1
      plan_id: {
        type: Number,
        default: -1
      },
      col_names: {
        type: Array,
        default: []
      },
      env: Array,
      add_time: Number,
      test_url: String,
      status: String,
      data: Schema.Types.Mixed
    };
  }

  get(id) {
    return this.model.findOne({
      _id: id
    });
  }

  save(data) {
    data.add_time = yapi.commons.time();
    let log = new this.model(data);
    return log.save();
  }

  findByProject(id) {
    return this.model
      .find({
        project_id: id
      })
      .exec();
  }

  findByPlan(id) {
    return this.model
      .find({
        plan_id: id
      })
      .sort({ _id: -1 })
      .exec();
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  deleteByIds(ids) {
    return this.model.remove({ _id: { $in: ids } });
  }

  deleteAll(plan_id) {
    return this.model.remove({ plan_id: plan_id });
  }
}

module.exports = testResultModel;
