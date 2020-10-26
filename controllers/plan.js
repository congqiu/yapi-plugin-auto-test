const baseController = require('controllers/base.js');
const testPlanModel = require('../models/plan');
const yapi = require('yapi.js');
const schedule = require('../schedule')

class testPlanController extends baseController {
  constructor(ctx) {
    super(ctx);

    this.testPlanModel = yapi.getInst(testPlanModel);
    this.schedule = yapi.getInst(schedule);
  }

  /**
   * 获取项目下的测试计划
   * @param {*} ctx 
   */
  async getTestPlans(ctx) {
    try {
      const projectId = ctx.params.project_id;

      if ((await this.checkAuth(projectId, 'project', 'view')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限'));
      }

      let plans = await this.testPlanModel.findByProject(projectId)
      ctx.body = yapi.commons.resReturn(plans);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 新建测试计划
   * @param {*} ctx 
   */
  async saveTestPlan(ctx) {
    let params = ctx.request.body;

    params = yapi.commons.handleParams(params, {
      plan_name: 'string',
      plan_url: 'string',
      plan_cron: 'string',
      plan_result_size: 'number',
      plan_fail_retries: 'number'
    });

    if ((await this.checkAuth(params.project_id, 'project', 'edit')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限添加'));
    }

    if (!params.plan_name) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '计划名不能为空'));
    }

    if (!params.plan_url) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '测试链接不能为空'));
    }

    if (!params.plan_cron) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'Cron表达式不能为空'));
    }

    let checkRepeat = await this.testPlanModel.findByName(params.plan_name, params.project_id);

    if (checkRepeat) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '计划名重复'));
    }
    
    try {
      let data = {
        project_id: params.project_id,
        plan_name: params.plan_name,
        is_plan_open: params.is_plan_open,
        plan_cron: params.plan_cron,
        plan_url: params.plan_url,
        plan_result_size: params.plan_result_size,
        plan_fail_retries: Math.min(Math.max(params.plan_fail_retries, 0), 10),
        notice_triggers: params.notice_triggers,
        notifier: {
          target: "workWX",
          url: params.notifier_url
        },
        uid: this.getUid()
      }
      let plan = await this.testPlanModel.save(data);
      if (data.is_plan_open) {
        this.schedule.addTestJob(plan._id, plan);
      }
      ctx.body = yapi.commons.resReturn(plan);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 更新测试计划
   * @param {*} ctx 
   */
  async updateTestPlan(ctx) {
    let params = ctx.request.body;

    const id = params.id;

    params = yapi.commons.handleParams(params, {
      plan_name: 'string',
      plan_url: 'string',
      plan_cron: 'string',
      plan_result_size: 'number',
      plan_fail_retries: 'number'
    });

    if ((await this.checkAuth(params.project_id, 'project', 'edit')) !== true) {
      return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限更新'));
    }

    if (!params.plan_name) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '计划名不能为空'));
    }

    if (!params.plan_url) {
      return (ctx.body = yapi.commons.resReturn(null, 400, '测试链接不能为空'));
    }

    if (!params.plan_cron) {
      return (ctx.body = yapi.commons.resReturn(null, 400, 'Cron表达式不能为空'));
    }

    let checkRepeat = await this.testPlanModel.findByName(params.plan_name, params.project_id);

    if (checkRepeat && checkRepeat._id !== id) {
      return (ctx.body = yapi.commons.resReturn(null, 401, '计划名重复'));
    }
    
    try {
      let data = {
        project_id: params.project_id,
        plan_name: params.plan_name,
        is_plan_open: params.is_plan_open,
        plan_cron: params.plan_cron,
        plan_url: params.plan_url,
        plan_result_size: params.plan_result_size,
        plan_fail_retries: Math.min(Math.max(params.plan_fail_retries, 0), 10),
        notice_triggers: params.notice_triggers,
        notifier: {
          target: "workWX",
          url: params.notifier_url
        }
      }
      if (params.notice_trigger) {
        data.notice_trigger = "";
      }
      await this.testPlanModel.update(id, data);
      let plan = await this.testPlanModel.find(id);
      //操作定时任务
      if (data.is_plan_open) {
        this.schedule.addTestJob(id, plan);
      } else {
        this.schedule.deleteTestJob(id);
      }
      ctx.body = yapi.commons.resReturn(plan);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 删除测试计划
   * @param {*} ctx 
   */
  async delTestPlan(ctx) {
    try {
      const id = ctx.params.id;

      if (!id) {
        return (ctx.body = yapi.commons.resReturn(null, 400, 'id不能为空'));
      }

      if ((await this.checkAuth(ctx.params.project_id, 'project', 'edit')) !== true) {
        return (ctx.body = yapi.commons.resReturn(null, 405, '没有权限删除'));
      }

      let result = await this.testPlanModel.del(id)
      this.schedule.deleteTestJob(id);

      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 402, e.message);
    }
    
  }
}

module.exports = testPlanController;