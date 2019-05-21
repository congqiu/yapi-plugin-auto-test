const schedule = require('node-schedule');
const planModel = require('./models/plan');
const resultModel = require('./models/result');
const resultController = require('./controllers/result');
const yapi = require('yapi.js');
const axios = require('axios');
const jobMap = new Map();

/**
 * 定时执行测试计划
 */
class testSchedule {
    constructor(ctx) {
        this.ctx = ctx;

        this.planModel = yapi.getInst(planModel);
        this.resultModel = yapi.getInst(resultModel);
        this.resultController = yapi.getInst(resultController);
        this.init()
    }

    //初始化定时任务
    async init() {
        let allPlan = await this.planModel.listAll();
        for (let i = 0, len = allPlan.length; i < len; i++) {
            let plan = allPlan[i];
            if (plan.is_plan_open) {
                this.addTestJob(plan._id, plan);
            }
        }
    }

    /**
     * 添加一个测试计划
     * @param {测试计划id} planId 
     * @param {测试计划} plan 
     */
    async addTestJob(planId, plan) {
        var url = plan.plan_url;

        // 自动测试不支持下载
        url = url.replace("download=true", "download=false");
        url = url.replace("mode=html", "mode=json");
        // 清空url中带的plan_id
        url = url.replace(/&plan_id=\d+&/, "&")
        // 替换API
        url = url.replace("/api/open/run_auto_test", "/api/open/plugin/test/run");
        url += "&plan_id=" + planId;


        let handlerPlan = async (planId, plan) => {
            let result = await axios.get(url)
            this.saveTestLog(plan.plan_name, result.data.message.msg, plan.uid, plan.project_id);
            if (plan.plan_result_size >= 0) {
                let results = await this.resultModel.findByPlan(planId);
                let ids = results.map((val) => val._id).slice(plan.plan_result_size);
                await this.resultModel.deleteByIds(ids);
            }
        }

        let scheduleItem = schedule.scheduleJob(plan.plan_cron, async () => {
            handlerPlan(planId, plan);
        });

        //判断是否已经存在这个任务
        let jobItem = jobMap.get(planId);
        if (jobItem) {
            jobItem.cancel();
        }
        jobMap.set(planId, scheduleItem);
    }

    /**
     * 获取测试计划
     * @param {测试计划id} planId 
     */
    getTestJob(planId) {
        return jobMap.get(planId);
    }

    /**
     * 删除测试计划
     * @param {测试计划id} planId 
     */
    deleteTestJob(planId) {
        let jobItem = jobMap.get(planId);
        if (jobItem) {
            jobItem.cancel();
        }
    }

    // 动态中添加测试结果
    saveTestLog(plan, msg, uid, projectId) {
        yapi.commons.saveLog({
            content: `成功执行计划名为"${plan}"的自动化测试，${msg}。`,
            type: 'project',
            uid: uid,
            username: "自动化测试",
            typeid: projectId
        });
    }
}

module.exports = testSchedule;