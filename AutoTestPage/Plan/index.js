import React, { Component } from "react";
import PropTypes from "prop-types";
import { formatTime } from "client/common.js";
import { Form, Switch, Button, Input, Icon, Tooltip, Checkbox, InputNumber } from "antd";
const FormItem = Form.Item;

import "./index.scss"

// layout
const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 10 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
  },
  className: "form-item"
};
const tailFormItemLayout = {
  wrapperCol: {
    sm: {
      span: 16,
      offset: 11
    }
  }
};


const triggerOptions = [
  { label: "执行结束", value: "any" },
  { label: "不发送", value: "never" },
  { label: "全部通过", value: "success" },
  { label: "全部失败", value: "fail" },
  { label: "部分失败", value: "part" }
];

@Form.create()
export default class Add extends Component {
  static propTypes = {
    form: PropTypes.object,
    planMsg: PropTypes.object,
    onSubmit: PropTypes.func,
    handleNameInput: PropTypes.func,
    planNames: PropTypes.array
  };

  constructor(props) {
    super(props);
    this.state = {
      auto_test_data: props.planMsg,
      notifier_url: props.planMsg.notifier && props.planMsg.notifier.url
    };
  }

  // 获取兼容后的触发器
  getCompatibleTrigger = plan => {
    if (!plan.notice_triggers && plan.notice_trigger) {
      return [plan.notice_trigger];
    }
    return plan.notice_triggers || ["never"];
  }

  handleSubmit = async () => {
    const { form, planMsg, onSubmit } = this.props;
    let params = {
      id: planMsg._id,
      project_id: planMsg.project_id,
      is_plan_open: this.state.auto_test_data.is_plan_open,
      notifier_url: this.state.notifier_url
    };
    form.validateFields(async (err, values) => {
      if (!err) {
        let assignValue = Object.assign(params, values);
        onSubmit(assignValue);
      }
    });
  };

  componentWillMount() {
    //默认每小时随机数分钟同步一次
    this.setState({
      random_corn: "1 " + Math.round(Math.random() * 60) + " * * * *"
    });
  }

  // 是否开启
  onChange = v => {
    let auto_test_data = this.state.auto_test_data;
    auto_test_data.is_plan_open = v;
    this.setState({
      auto_test_data: auto_test_data
    });
  }

  onTriggerChange = v => {
    let auto_test_data = this.state.auto_test_data;
    auto_test_data.notice_triggers = v;
    this.setState({
      auto_test_data: auto_test_data
    });
  }

  // 打开一个新窗口执行一次计划
  runPlan = () => {
    const { form } = this.props;
    form.validateFields(async (err, values) => {
      if (!err) {
        window.open(values.plan_url, "_blank");
      }
    });
  }

  render() {
    const { planNames, planMsg } = this.props;
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="m-panel">
        <Form>
          <FormItem
            label="是否执行测试计划"
            {...formItemLayout}
          >
            <Switch
              checked={this.state.auto_test_data.is_plan_open}
              onChange={this.onChange}
              checkedChildren="开"
              unCheckedChildren="关"
            />

            {planMsg._id ? (<Button
              type="primary"
              icon="play-circle"
              className="run-once"
              onClick={this.runPlan}
            >
              执行一次
            </Button>) : null}

            {this.state.auto_test_data.last_test_time != null ?
              (<div>上次执行时间: <span className="testtime">{formatTime(this.state.auto_test_data.last_test_time)}</span></div>) : null}
          </FormItem>

          <div>
            <FormItem {...formItemLayout} label="计划名称">
              {getFieldDecorator("plan_name", {
                rules: [
                  {
                    required: true,
                    message: "请输入计划名称"
                  },
                  {
                    validator: (rule, value, callback) => {
                      if (value) {
                        if (planNames.includes(value)) {
                          callback("计划名称重复");
                        } else if (!/\S/.test(value)) {
                          callback("请输入计划名称");
                        } else {
                          callback();
                        }
                      } else {
                        callback("请输入计划名称");
                      }
                    }
                  }
                ],
                validateTrigger: "onBlur",
                initialValue: this.state.auto_test_data._id === 0 ? "" : this.state.auto_test_data.plan_name
              })(<Input onChange={e => this.props.handleNameInput(e.target.value)} />)}
            </FormItem>

            <FormItem {...formItemLayout}
              label={
                <span>
                  自动测试URL&nbsp;
                  <Tooltip title="复制测试集合服务端测试的URL">
                    <Icon type="question-circle-o" />
                  </Tooltip>
                </span>
              }>
              {getFieldDecorator("plan_url", {
                rules: [
                  {
                    required: true,
                    message: "请输入服务器端自动测试URL"
                  }
                ],
                validateTrigger: "onBlur",
                initialValue: this.state.auto_test_data.plan_url
              })(<Input />)}
            </FormItem>

            <FormItem {...formItemLayout} label={<span>类cron风格表达式&nbsp;<a href="https://github.com/node-schedule/node-schedule">GitHub</a></span>}>
              {getFieldDecorator("plan_cron", {
                rules: [
                  {
                    required: true,
                    message: "请输入node-schedule的类cron表达式!"
                  }
                ],
                initialValue: this.state.auto_test_data.plan_cron ? this.state.auto_test_data.plan_cron : this.state.random_corn
              })(<Input />)}
            </FormItem>

            <FormItem {...formItemLayout} label={
              <span>
                保留测试结果数，-1为不限&nbsp;
                <Tooltip title="配置影响每个测试计划保留的测试结果数，设置为-1表示不限，下次执行生效">
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }>
              {getFieldDecorator("plan_result_size", {
                rules: [
                  {
                    required: true,
                    message: "请输入保留次数"
                  }, {
                    validator: (rule, value, callback) => {
                      if (value !== "") {
                        if (!/^\d+$/.test(value) && value != -1) {
                          callback("请输入非负整数或-1");
                        } else {
                          callback();
                        }
                      } else {
                        callback("请输入保留次数");
                      }
                    }
                  }
                ],
                validateTrigger: "onBlur",
                initialValue: this.state.auto_test_data.plan_result_size
              })(<InputNumber min={-1} />)}
            </FormItem>

            <FormItem {...formItemLayout} label={
              <span>
                失败后重复执行次数&nbsp;
                <Tooltip title="当执行完成之后如果存在失败的情况会自动重新执行">
                  <Icon type="question-circle-o" />
                </Tooltip>
              </span>
            }>
              {getFieldDecorator("plan_fail_retries", {
                rules: [
                  {
                    required: true,
                    message: "请输入次数"
                  }, {
                    validator: (rule, value, callback) => {
                      if (value !== "") {
                        if (!/^\d+$/.test(value)) {
                          callback("请输入非负整数");
                        } else if (parseInt(value, 10) > 10) {
                          callback("考虑服务器压力，单个任务暂不支持10次以上重试");
                        } else {
                          callback();
                        }
                      } else {
                        callback("请输入次数");
                      }
                    }
                  }
                ],
                validateTrigger: "onBlur",
                initialValue: this.state.auto_test_data.plan_fail_retries
              })(<InputNumber min={0} />)}
            </FormItem>

            <FormItem {...formItemLayout} label="触发通知">
              {getFieldDecorator("notice_triggers", {
                initialValue: this.getCompatibleTrigger(this.state.auto_test_data)
              })(
                <Checkbox.Group
                  options={triggerOptions}
                  onChange={this.onTriggerChange}
                />
              )}
            </FormItem>
            <FormItem {...formItemLayout} label={<span>通知机器人URL&nbsp;<a rel="noopener noreferrer" target="_blank" href="https://github.com/congqiu/yapi-plugin-auto-test/blob/master/README.md#%E6%B5%8B%E8%AF%95%E8%AE%A1%E5%88%92">文档</a></span>}>
              {getFieldDecorator("notifier_url", {
                initialValue: this.state.notifier_url
              })(<Input placeholder="企业微信、钉钉机器人完整地址或自定义webhook的地址" />)}
            </FormItem>
          </div>
          <FormItem {...tailFormItemLayout}>
            <Button type="primary" htmlType="submit" icon="save" size="large" onClick={this.handleSubmit}>
              保存
            </Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}
