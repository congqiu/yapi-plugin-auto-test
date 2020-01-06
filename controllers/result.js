const openController = require('controllers/open.js');
const projectModel = require('models/project.js');
const testResultModel = require('./../models/result');
const testPlanModel = require('./../models/plan');
const yapi = require('yapi.js');
const _ = require('underscore');
const renderToHtml = require('../../../server/utils/reportHtml');
const tools = require('../utils/tools')

class testResultController extends openController {
  constructor(ctx) {
    super(ctx);

    this.testResultModel = yapi.getInst(testResultModel);
    this.testPlanModel = yapi.getInst(testPlanModel);
    this.projectModel = yapi.getInst(projectModel);
    this.schemaMap = {
      runAutoTest: {
        '*id': 'number',
        extraIds: 'string',
        project_id: 'string',
        token: 'string',
        mode: {
          type: 'string',
          default: 'json'
        },
        email: {
          type: 'boolean',
          default: false
        },
        download: {
          type: 'boolean',
          default: false
        },
        closeRemoveAdditional: true
      }
    };
  }
  
  /**
   * 执行测试计划
   * @param {*} ctx 
   */
  async runAutoTest(ctx) {

    if (!this.$tokenAuth) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'token 验证失败'));
    }

    const projectId = ctx.params.project_id;
    const planId = ctx.params.plan_id || -1;
    const startTime = new Date().getTime();
    const records = (this.records = {});
    const reports = (this.reports = {});
    const testList = [], testColNames = [];
    let id = ctx.params.id;

    let extraIds = ctx.params.extraIds ? ctx.params.extraIds.split(',') : [];
    let curEnvList = this.handleEvnParams(ctx.params);

    let colData = await this.interfaceColModel.get(id);
    if (!colData) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'id值不存在'));
    }

    let projectData = await this.projectModel.get(projectId);

    extraIds.push(id);
    for (let idIndex = 0; idIndex < extraIds.length; idIndex++) {
      id = extraIds[idIndex];
      let caseList = await yapi.commons.getCaseList(id);
      if (caseList.errcode !== 0) {
        ctx.body = caseList;
      }

      let colDataInfo = caseList.colData || {};
      testColNames.push(colDataInfo.name);

      caseList = caseList.data;
      for (let i = 0, l = caseList.length; i < l; i++) {
        let item = caseList[i];
        let projectEvn = await this.projectModel.getByEnv(item.project_id);
  
        item.id = item._id;
        let curEnvItem = _.find(curEnvList, key => {
          return key.project_id == item.project_id;
        });
  
        item.case_env = curEnvItem ? curEnvItem.curEnv || item.case_env : item.case_env;
        item.req_headers = this.handleReqHeader(item.req_headers, projectEvn.env, item.case_env);
        item.pre_script = projectData.pre_script;
        item.after_script = projectData.after_script;
        item.env = projectEvn.env;
        let result;
        // console.log('item',item.case_env)
        try {
          result = await this.handleTest(item);
        } catch (err) {
          result = err;
        }
  
        reports[item.id] = result;
        records[item.id] = {
          params: result.params,
          body: result.res_body
        };
        testList.push(result);
      }
    }

    function getMessage(testList) {
      let successNum = 0,
        failedNum = 0,
        len = 0,
        msg = '';
      testList.forEach(item => {
        len++;
        if (item.code === 0) {
          successNum++;
        }
        else {
          failedNum++;
        }
      });
      if (failedNum === 0) {
        msg = `一共 ${len} 测试用例，全部验证通过`;
      } else {
        msg = `一共 ${len} 测试用例，${successNum} 个验证通过， ${failedNum} 个未通过`;
      }

      return { msg, len, successNum, failedNum };
    }

    const endTime = new Date().getTime();
    const executionTime = (endTime - startTime) / 1000;

    let reportsResult = {
      message: getMessage(testList),
      runTime: executionTime + 's',
      startTime: startTime,
      numbs: testList.length,
      list: testList
    };

    yapi.commons.log(reportsResult.message.msg);

    let mode = ctx.params.mode || 'html';
    if(ctx.params.download === true) {
      ctx.set('Content-Disposition', `attachment; filename=test.${mode}`);
    }
    try {
      let testData = {
        project_id: projectId,
        plan_id: planId,
        uid: this.getUid(),
        col_names: testColNames,
        env: curEnvList,
        test_url: ctx.href,
        status: reportsResult.message.failedNum === 0 ? "成功" : "失败",
        data: reportsResult
      };
      let saveResult = await this.testResultModel.save(testData);

      if (planId && planId !== -1) {
        await this.testPlanModel.update(planId, {last_test_time: yapi.commons.time()});
        let plan = await this.testPlanModel.find(planId);
        let trigger = plan.notice_trigger, notifier = plan.notifier ? plan.notifier.url : "";
        let successNum = reportsResult.message.successNum;
        let isSend = (trigger === "any")
                      || (trigger === "success" && reportsResult.message.failedNum === 0)
                      || (trigger === "fail" && successNum === 0)
                      || (trigger === "part" && successNum < reportsResult.message.len && successNum > 0);
        if (isSend) {
          let content = `测试结果：<font color="warning">${testData.status}</font>\n${reportsResult.message.msg}
          \n访问以下[链接查看](${ctx.request.origin}/api/open/plugin/test/result?id=${saveResult._id})测试结果详情
          `;
          tools.sendWorkWX(notifier, content)
        }
      }

      if (ctx.params.email === true && reportsResult.message.failedNum !== 0) {
        let autoTestUrl = `${ctx.request.origin}/api/open/plugin/test/result?id=${saveResult._id}`;
        yapi.commons.sendNotice(projectId, {
          title: `YApi自动化测试报告`,
          content: `
          <html>
          <head>
          <title>测试报告</title>
          <meta charset="utf-8" />
          <body>
          <div>
          <h3>测试结果：</h3>
          <p>${reportsResult.message.msg}</p>
          <h3>访问以下链接查看测试结果详情：</h3>
          <p><a herf="${autoTestUrl}">${autoTestUrl}</a></p>
          </div>
          </body>
          </html>`
        });
      }
    } catch (e) {
      yapi.commons.log(e, 'error');
    }
    if (ctx.params.mode === 'json') {
      return (ctx.body = reportsResult);
    } else {
      return (ctx.body = renderToHtml(reportsResult));
    }
  }

  /**
   * 获取项目下的测试结果
   * @param {*} ctx 
   */
  async getTestResults(ctx) {
    try {
      const projectId = ctx.params.project_id;
      const planId = ctx.params.plan_id;
      let results;
      if (projectId) {
        results = await this.testResultModel.findByProject(projectId)
      }
      if (planId) {
        results = await this.testResultModel.findByPlan(planId)
      }
      ctx.body = yapi.commons.resReturn(results);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 获取测试结果
   * @param {*} ctx 
   */
  async getTestResult(ctx) {
    if (!this.$tokenAuth && !this.$auth) {
      return (ctx.body = yapi.commons.resReturn(null, 40022, 'token 验证失败'));
    }
    try {
      const id = ctx.params.id;
      let results = await this.testResultModel.get(id)
      ctx.body = renderToHtml(results.data);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }

  /**
   * 清空测试结果
   * @param {*} ctx 
   */
  async delTestResults(ctx) {
    try {
      const plan_id = ctx.params.plan_id;
      let result = await this.testResultModel.deleteAll(plan_id);
      ctx.body = yapi.commons.resReturn(result);
    } catch (e) {
      ctx.body = yapi.commons.resReturn(null, 401, e.message);
    }
  }
}

module.exports = testResultController;