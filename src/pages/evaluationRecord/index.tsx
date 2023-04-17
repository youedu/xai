import { ProTable, ModalForm, ProFormRadio } from '@ant-design/pro-components';
import type { ProColumns, ProFormInstance, ColumnsState } from '@ant-design/pro-components';
import {Button, Input, Select, Form, message, Tag} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import {history, Link} from "umi";
import {dataSetQuery, evaluationRecordQuery} from "@/services/ant-design-pro/api";
import {
  CloseCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {useModel} from "@@/plugin-model/useModel";

const {Search} = Input;

interface ActionType {
  reload: (resetPageIndex?: boolean) => void;
  reloadAndRest: () => void;
  reset: () => void;
  clearSelected?: () => void;
  startEditable: (rowKey: Key) => boolean;
  cancelEditable: (rowKey: Key) => boolean;
}


const statusEnum = {
  0: 'online',
  1: 'running',
  2: 'failing'
};
const taskTypeEnum = {
  0: 'img',
  1: 'text',
}
const evaTypeEnum = {
  0: '正确性',
  1: '鲁棒性',
  2: '可解释性',
}

export type TableListItem = {
  evaluateState: number;
  modelState: number;
  key: number;
  id: string;
  name: string;
  taskType: string;
  evaType: string;
  dataSet: string;
  model: string;
  status: string;
  createdAt: number;
};

const tableListDataSource: TableListItem[] = [];

/*for (let i = 0; i < 10; i += 1) {
  tableListDataSource.push({
    key: i,
    id: 'M'+(i + 1) ,
    name: `图片classification`,
    taskType: taskTypeEnum[Math.floor(Math.random() * 10) % 2],
    evaType: evaTypeEnum[Math.floor(Math.random() * 10) % 3],
    dataSet: 'imgNet',
    model: 'ResNet-50',
    status: statusEnum[Math.floor(Math.random() * 10) % 2],
    createdAt: Date.now() - Math.floor(Math.random() * 20000 * i),
  });
}*/

// @ts-ignore
// @ts-ignore
const columns: ProColumns<TableListItem>[] = [
  {
    title: <b>ID</b>,
    dataIndex: 'id',
    ellipsis: true,
  },
  {
    title: <b>任务类型</b>,
    dataIndex: 'taskTypeId',
    initialValue: 'all',
    ellipsis: true,
/*    filters: true,
    onFilter: true,*/
    valueType: 'select',
    valueEnum: {
      1: {text: '图像分类'},
      2: {text: '文本分类'},
      3: {text: '表格分类'},
    },
  },
  {
    title: <b>任务名称</b>,
    dataIndex: 'taskName',
    ellipsis: true,
  },
  {
    title: <b>测评类型</b>,
    dataIndex: 'evaluateType',
    ellipsis: true,
    initialValue: 'all',
    filters: true,
    onFilter: true,
    valueType: 'select',
    valueEnum: {
      all: { text: '全部', status: 'Default' },
      正确性: { text: '正确性', status: 'Processing' },
      鲁棒性: { text: '鲁棒性', status: 'Processing' },
      可解释性: { text: '可解释性', status: 'Processing' },
      适应性: {text: '适应性', status: 'Processing'},
    },
  },
  {
    title: <b>测评方法</b>,
    dataIndex: 'methodName',
/*    ellipsis: false,*/
    width: 250,
    render: (_ , { methodName }) => {
      //console.log(methodName);
      return (
      <>
        {methodName.map((method, index) => {
          let colors = ['geekblue' , 'magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green'];
          let color;
          if (index < colors.length){
            color = colors[index];
          }
          else{
            color = 'geekblue';
          }
          return (
            <Tag color={color} key={method}>
              {method}
            </Tag>
          );
        })}
      </>
    );},
  },
  {
    title: <b>测评模型</b>,
    dataIndex: 'modelName',
    ellipsis: true,
  },
  {
    title: <b>测评数据</b>,
    dataIndex: 'dataSetName',
    ellipsis: true,
  },
  {
    title: <b>创建时间</b>,
    valueType: 'dateTime',
    dataIndex: 'createTime',
    ellipsis: true,
    // sorter: (a, b) => a.createdAt - b.createdAt,
  },
  {
    title: <b>测评状态</b>,
    dataIndex: 'id',
    ellipsis: true,
    render: (_, row) => {
      if(row.evaluateState === 0)
        return <><CloseCircleOutlined/>测评失败</>;
      else if(row.evaluateState === 1)
        return <><SyncOutlined spin />测评中</>;
      else
        return <><CheckCircleOutlined/><Link to={'/evaluationresult?resultId='+row.id.toString()}>测评成功</Link></>;
    }
  },
];


export default () => {
  const {robustEvaluationConfig, setRobustEvaluationConfig} = useModel('robustConfig', (ret) => ({
    robustEvaluationConfig: ret.robustEvaluationConfig,
    setRobustEvaluationConfig: ret.setRobustEvaluationConfig,
  }));

  const {evaConfig, setEvaConfig} = useModel('config', (ret) => ({
    evaConfig: ret.evaluationConfig,
    setEvaConfig: ret.setEvaluationConfig,
  }));

  const [data , setData] = useState();

  useEffect(() => {
    setEvaConfig({});
    setRobustEvaluationConfig({});
    setData(['图像分类', '文本分类', '表格分类']);
  }, []);

  //保存数据类型
  const [first, setFirst] = useState(1);

  const ref = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [queryType, setQueryType] = useState('');
  const [queryContent, setQueryContent] = useState('');
  const [columnsStateMap, setColumnsStateMap] = useState<Record<string, ColumnsState>>({
    name: {
      show: false,
      order: 2,
    },
  });

  const [dataType, setDataType] = useState(1);

  //第一层modalform
  const [modalForm] = Form.useForm();
  const modalRef = useRef<ProFormInstance>();


  return (<>
      <div style={{fontSize: '20px', fontWeight: 'bold'}}>测评记录</div>
    <ProTable<TableListItem, { keyWord?: string }>
      columns={columns}
      //dataSource={tableListDataSource}
      toolbar={{
        search: (<Input.Group compact>
          <Select
            defaultValue=""
            style={{ width: 100 }}
            onChange={event => setQueryType(event)}
            options={[
              {
                value: '0',
                label: 'ID',
              },
              {
                value: '1',
                label: '任务名称',
              },
            ]}
          />
          <Search onChange={event => setQueryContent(event.target.value)}
                  enterButton={true}
                  allowClear={true}
                  style={{ width: '70%' }}
                  onReset={() => {
                    //console.log('hello');
                  }}
                  onSearch={(value: string, event) => {
                  ref.current?.reload();
                  }}
          />
        </Input.Group>)
        /*{
          onSearch: (value: string, event) => {
            //console.log(value);
            ref.current?.reload();
          },
          enterButton: true,
        }*/
      }}
/*      request={(params) =>{
        //console.log(queryContent);
        //console.log(queryType);
        return Promise.resolve({
          data: tableListDataSource.filter((item) => {
/!*            if (!params?.keyWord) {
              return true;
            }
            if (item.name.includes(params?.keyWord) || item.status.includes(params?.keyWord)) {
              return true;
            }*!/
            return true;
          }),
          success: true,
        })
      }
      }*/
      request={async (
        // 第一个参数 params 查询表单和 params 参数的结合
        // 第一个参数中一定会有 pageSize 和  current ，这两个参数是 antd 的规范
        params: T & {
          pageSize: number;
          current: number;
        },
        sort,
        filter,
      ) => {
        // 这里需要返回一个 Promise,在返回之前你可以进行数据转化
        // 如果需要转化参数可以在这里进行修改
        //console.log(filter);
        let taskType = [];
        if(filter.evaluateType === null){
          taskType = [0, 1, 2, 3]
        }
        else{
          for (let item of filter.evaluateType){
            if (item === '正确性')
              taskType.push(1);
            else if (item === '适应性')
              taskType.push(3);
            else if (item === '鲁棒性')
              taskType.push(0);
            else
              taskType.push(2);
          }
        }
        //console.log(taskType);
        const msg = await evaluationRecordQuery(params, queryType, queryContent, taskType);
        //console.log(msg);
        if(msg.code === '00000') {
/*          for (let item of msg.data.records){
              let res = '';
              for (const method of item.methodName){
                res = res + method;
              }
              item.methodName = item.methodName.join(',');
          }*/
          return {
            data: msg.data.records,
            // success 请返回 true，
            // 不然 table 会停止解析数据，即使有数据
            success: true,
            // 不传会使用 data 的长度，如果是分页一定要传
            total: msg.data.total,
          };
        }
        else
          message.error(msg.message);
        return false;
      }}

/*      options={{
        search: true,
      }}
      rowKey="key"
      columnsState={{
        value: columnsStateMap,
        onChange: setColumnsStateMap,
      }}*/
      rowKey="key"
      actionRef={ref}
      formRef={formRef}
      pagination={{
        pageSize: 10,
        showSizeChanger: false,
      }}
      search={false}
      dateFormatter="string"
      options={false}
      toolBarRender={() =>[
/*        <Input.Group compact>
          <Select
            defaultValue="lucy"
            style={{ width: 120 }}
            options={[
              {
                value: 'jack',
                label: 'Jack',
              },
              {
                value: 'lucy',
                label: 'Lucy',
              },
            ]}
          />
          <Input style={{ width: '50%' }}/>
        </Input.Group>,*/
        <ModalForm
          modalProps={{
            destroyOnClose: true
          }}
          preserve={false}
          form={modalForm}
          formRef={modalRef}
          title="测评类型"
          trigger={<Button type="primary" onClick={() => {
            setFirst(1);
          }
          }>新建测评</Button>}
          submitter={{
            searchConfig: {
              submitText: '确认',
              resetText: '取消',
            },
          }}
          onFinish={async (values) => {
            let taskTypeId;
            if(modalForm.getFieldValue('dataType') === 1)
            {
               taskTypeId = modalForm.getFieldValue('taskType1')
            }
            if(modalForm.getFieldValue('dataType') === 2)
            {
              taskTypeId = modalForm.getFieldValue('taskType2')
            }
            if(modalForm.getFieldValue('dataType') === 3)
            {
              taskTypeId = modalForm.getFieldValue('taskType3')
            }
            history.push({
              pathname: '/recordcreate',
              query: {
                taskTypeId: taskTypeId,
              },
            });
            return true;
          }}
        >
          <ProFormRadio.Group
            onChange={()=>{
              setFirst(modalForm.getFieldValue('dataType'));
              setDataType(modalForm.getFieldValue('dataType'));
            }}
            initialValue={1}
            name="dataType"
            label="数据类型"
            radioType="button"
            options={[
              {
                label: '图像',
                value: 1,
              },
              {
                label: '文本',
                value: 2,
              },
              {
                label: '表格',
                value: 3,
              },
            ]}
          />
          {(first === 1) && (
            <ProFormRadio.Group
              name="taskType1"
              label="任务类型"
              dependencies={['dataType']}
              radioType="button"
              initialValue={1}
              request={()=>{
                return [
                  {value: 1, label: '图像分类'},
                ];
              }}
            />
          )}
          {first === 2 && (
            <ProFormRadio.Group
              name="taskType2"
              label="任务类型"
              dependencies={['dataType']}
              radioType="button"
              initialValue={2}
              request={()=>{
                return [
                  {value: 2, label: '文本分类'},
                ];
              }}
            />
          )}
          {first === 3 && (
            <ProFormRadio.Group
              name="taskType3"
              label="任务类型"
              dependencies={['dataType']}
              radioType="button"
              initialValue={3}
              request={()=>{
                return [
                  {value: 3, label: '表格分类'},
                ];
              }}
            />
          )}
{/*          <ProFormRadio.Group
            onChange={()=>{setDataType(modalForm.getFieldValue('dataType'));}}
            initialValue={1}
            name="dataType"
            label="数据类型"
            radioType="button"
            options={[
              {
                label: '图像',
                value: 1,
              },
              {
                label: '文本',
                value: 2,
              },
              {
                label: '表格',
                value: 3,
              },
            ]}
          />
          <ProFormRadio.Group
            name="taskType"
            label="任务类型"
            dependencies={['dataType']}
            radioType="button"
            initialValue={1}
            request={()=>{
              if(modalForm.getFieldValue('dataType') === 1) {
                modalForm.setFieldValue('taskType', 1);
                return [
                  {value: 1, label: '图像分类'},
                  {value: 4, label: '图像识别'}
                ];
              }
              else if(modalForm.getFieldValue('dataType') === 2) {
                modalForm.setFieldValue('taskType', 2);
                return [
                  {value: 2, label: '文本分类'},
                ];
              }
              else {
                modalForm.setFieldValue('taskType', 3);
                return [
                  {value: 3, label: '表格分类'},
                ];
              }
            }}
          />*/}

        </ModalForm>
      ]
      }
    />
    </>
  );
};

