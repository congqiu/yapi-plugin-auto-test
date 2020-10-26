import React, { Component } from "react";
import PropTypes from "prop-types";
import { Layout, Timeline, Icon, Spin, Row, Button, Popconfirm, message } from "antd";
const { Content } = Layout;
import axios from 'axios';
import { formatTime } from 'client/common.js';

import "./index.scss"
export default class Result extends Component {
  static propTypes = {
    planId: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      results: [],
      loading: true
    };
  }

  async componentWillMount() {
    this._isMounted = true;
    await this.getResultsList();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  // 获取测试结果
  async getResultsList() {
    let planId = this.props.planId;
    let result = await axios.get('/api/plugin/test/results?plan_id=' + planId);
    if (result.data.errcode === 0) {
      if (result.data.data) {
        this.setState({
          results: result.data.data,
          loading: false
        });
      }
    }
  }

  // 刷新列表
  freshResult = () => {
    this.getResultsList();
  }

  // 清空测试结果
  clearResults = async () => {
    let {planId, projectId} = this.props;
    let result = await axios.delete(`/api/plugin/test/results/del?plan_id=${planId}&project_id=${projectId}`);
    if (result.data.errcode === 0) {
      this.setState({ results: [] });
    } else {
      message.error(result.data.errmsg);
    }
  }

  render() {
    const { results } = this.state;

    const resultItems = results.map((item, index) => {
      let color = item.status === "成功" ? "green" : "red";
      let names = item.col_names.length > 3 ? item.col_names.slice(0, 3).join(", ") + "等" : item.col_names.join(", ");
      return (
        <Timeline.Item key={index} color={color} dot={<Icon type="clock-circle-o" style={{ fontSize: '16px' }} />}>
          {formatTime(item.add_time)}
          <p>{`成功执行包括${names}在内的用例，${item.data.message.msg}。任务执行总计${item.data.runTime}。查看`}<a target="_blank" href={"/api/open/plugin/test/result?id=" + item._id}>
            详细测试报告
          </a></p>
        </Timeline.Item>
      );
    });

    return (
      <Layout className="auto-test-result">
        <Content style={{
                      background: "#fff",
                      padding: 24,
                      margin: 0,
                      minHeight: 280
                    }}>
          <Row className="operations">
            <Button type="primary" icon="reload" size="small" onClick={this.freshResult}>
              刷新
            </Button>
            <Popconfirm
              title="确认清空全部测试结果?"
              onConfirm={e => {
                e.stopPropagation();
                this.clearResults();
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="primary" icon="delete" size="small">
              清空
              </Button>
            </Popconfirm>
          </Row>
          <Timeline>
            {resultItems}
          </Timeline>
          <div className="empty">
            <Spin spinning={this.state.loading} size="large" tip="正在加载..." />
          </div>
        </Content>
      </Layout>
    );
  }
}