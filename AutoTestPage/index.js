import React, { Component } from "react";
import PropTypes from "prop-types";
import { Tabs, Icon, Layout, Tooltip, Row, Popconfirm, message } from "antd";
const { Content, Sider } = Layout;
import { connect } from "react-redux";
import axios from 'axios';

import AddContent from "./Plan";
import Result from './Result';

import './index.scss';

@connect(
  state => {
    return {
      projectMsg: state.project.currProject
    };
  }
)
export default class Plan extends Component {
  static propTypes = {
    projectMsg: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = {
      plans: [],
      currentPlanMsg: {},
      delIcon: null,
      currentKey: -2
    };
  }

  async componentWillMount() {
    this._isMounted = true;
    await this.getPlanList();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // 获取测试计划列表
  async getPlanList() {
    let projectId = this.props.projectMsg._id;
    let result = await axios.get('/api/plugin/test/plan?project_id=' + projectId);
    if (result.data.errcode === 0) {
      if (result.data.data) {
        const plans = result.data.data;
        this.handleClick(0, plans[0], plans);
      }
    }
  }

  handleClick = (key, data, curValue) => {
    if (data) {
      var state = curValue ? {
        plans: curValue,
        currentPlanMsg: data,
        currentKey: key
      } : {
        currentPlanMsg: data,
        currentKey: key
      }
      this.setState(state);
    }
  };

  // 新增测试计划
  addParams = () => {
    let hasNew = this.state.plans.some(value => value._id ===0);
    if (hasNew) {
      message.error("请先保存当前新建的计划！");
      return;
    }
    let data = { _id: 0, plan_name: "新增测试计划", project_id: this.props.projectMsg._id, is_plan_open: false, plan_result_size: 10, plan_fail_retries: 0 };
    let plans = [].concat(data, this.state.plans);
    this.handleClick(0, data, plans);
  };

  // 删除
  async delParams(key) {
    let plans = this.state.plans;
    let currPlans = plans.filter((val, index) => {
      return index !== key;
    });
    let delPlan = plans.find((val, index) => index === key);
    this.handleClick(0, currPlans[0], currPlans);
    delPlan._id && await axios.delete("/api/plugin/test/plan/del?id=" + delPlan._id);
  }

  enterItem = key => {
    this.setState({ delIcon: key });
  };

  // 保存设置
  async onSave(value) {
    let result = {};
    if (value.id) {
      result = await axios.put("/api/plugin/test/plan/update", value);
    } else {
      result = await axios.post("/api/plugin/test/plan/add", value);
    }
    this.saveResult(result);
  }

  saveResult = (result) => {
    if (
      result.data &&
      result.data.errcode &&
      result.data.errcode !== 40011
    ) {
      message.error(result.data.errmsg);
    } else {
      message.success("保存成功");
      let currPlan = result.data.data;
      let plans = this.state.plans;
      plans.some((val, index) => {
        if (val._id ===0 || val._id === currPlan._id) {
          plans[index] = currPlan;
          return true;
        }
      });
      this.setState({
        currentPlanMsg: currPlan,
        plans: plans
      });
    }
  }

  //  提交保存信息
  onSubmit = (value) => {
    this.onSave(value);
  };

  // 动态修改计划名称
  handleInputChange = (value, currentKey) => {
    let newValue = [].concat(this.state.plans);
    newValue[currentKey].plan_name = value || "新增测试计划";
    this.setState({ plans: newValue });
  };

  render() {
    const { plans, currentKey } = this.state;

    let planNames = [];

    const planSettingItems = plans.map((item, index) => {
      index !== currentKey && planNames.push(item.plan_name);
      return (
        <Row
          key={index}
          className={"menu-item " + (index === currentKey ? "menu-item-checked" : "")}
          onClick={() => this.handleClick(index, item)}
          onMouseEnter={() => this.enterItem(index)}
        >
          <span className="test-icon-style">
            <span className="test-name" style={{ color: !item._id && "#2395f1" }}>
              {item.plan_name}
            </span>
            <Popconfirm
              title="确认删除此测试计划?"
              onConfirm={e => {
                e.stopPropagation();
                this.delParams(index);
              }}
              okText="确定"
              cancelText="取消"
            >
              <Icon
                type="delete"
                className="interface-delete-icon"
                style={{
                  display: this.state.delIcon == index ? "block" : "none"
                }}
              />
            </Popconfirm>
          </span>
        </Row>
      );
    });

    return (
      <div className="g-row">
        <Layout className="auto-test-panel">
          <Sider width={195} style={{ background: "#fff"}}>
            <Row className="plan-list-header menu-item">
              <div className="test-icon-style">
                <h3>
                  计划列表&nbsp;<Tooltip placement="top" title="在这里添加自动测试计划">
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </h3>
                <Tooltip title="添加自动测试计划">
                  <Icon type="plus" onClick={() => this.addParams()} />
                </Tooltip>
              </div>
            </Row>
            <div className="test-slider">
              {planSettingItems}
            </div>
          </Sider>
          <Layout className="test-content">
            <Content key={this.state.currentPlanMsg._id} style={{
                        display: plans.length > 0 ? "block" : "none",
                        padding: "0 24 24 24"
                      }}>
              <Tabs tabPosition="top">
                <Tabs.TabPane tab={
                  <span>
                    <Icon type="schedule" />
                    测试计划
                  </span>
                  }
                  key="1"
                >
                  <AddContent
                    planMsg={this.state.currentPlanMsg}
                    onSubmit={e => this.onSubmit(e, currentKey)}
                    handleNameInput={e => this.handleInputChange(e, currentKey)}
                    showResults={e => this.showResults(e)}
                    planNames={planNames}
                  />
                </Tabs.TabPane>
                <Tabs.TabPane tab={
                  <span>
                    <Icon type="line-chart" />
                    测试结果
                  </span>
                  }
                  key="2"
                >
                  <Result planId={this.state.currentPlanMsg._id} />
                </Tabs.TabPane>
              </Tabs>
            </Content>
            <Content style={{
                        display: plans.length === 0 ? "block" : "none",
                        padding: 24,
                        textAlign: "center"
                      }}>
              暂无计划，请在左侧添加新的测试计划
            </Content>
          </Layout>
        </Layout>
      </div>
    );
  }
}