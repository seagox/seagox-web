<template>
	<div class="container" v-loading="loading">
		<div :style="{ width: approvalVisible ? 'calc(100% - 324px)' : '100%' }">
			<div>
				<simplify-form
					ref="simplifyForm"
					:action="action"
					:formModel="form"
					:formCofig="formCofig"
					:property="property"
					:calculate="calculate"
					:disabled="disabled"
					:editable="editable"
					:hidden="hidden"
					:textModel="textModel"
				/>
			</div>
			<el-card style="margin-bottom:20px;" v-if="flowFlag === 1">
				<div slot="header">处理人意见区</div>
                <el-tabs v-model="activeName">
                    <el-tab-pane label="已处理" name="first">
                        <el-table :data="historyJson" style="width:100%" max-height="300">
                            <el-table-column label="审批人" prop="assigneeName"></el-table-column>
                            <el-table-column label="状态" prop="status" :formatter="statusFormatter"></el-table-column>
                            <el-table-column label="审批意见" prop="remark" show-overflow-tooltip></el-table-column>
                            <el-table-column label="提交时间" prop="endTime"></el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="待处理" name="second">
                        <el-table :data="todoList" style="width:100%" max-height="300">
                            <el-table-column label="审批人" prop="assigneeName"></el-table-column>
                            <el-table-column label="上一节点审批完成时间" prop="startTime"></el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="审批日志" name="third">
                        <el-table :data="todoDoneList" style="width:100%" max-height="300">
                            <el-table-column label="审批人" prop="assigneeName"></el-table-column>
                            <el-table-column label="状态" prop="status" :formatter="statusFormatter"></el-table-column>
                            <el-table-column label="审批意见" prop="remark" show-overflow-tooltip></el-table-column>
                            <el-table-column label="审批时间" prop="endTime"></el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
			</el-card>
		</div>
		<div class="footer">
			<div class="footer-right">
				<!--提交-->
				<el-button
					type="primary"
					icon="el-icon-connection"
					@click="handleProcess"
					v-if="flowFlag === 1 && !temporaryStorage"
					:disabled="disableButtonFlag.seaView"
					>流程查看</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-printer"
					@click="handlePrint"
					v-if="form.form && form.form.detailExportPath"
					:disabled="disableButtonFlag.print"
					>打印</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-delete"
					@click="handleDelete"
					v-if="(flowFlag === 1 && flowStatus === 1) || (flowFlag === 1 && temporaryStorage)"
					:disabled="disableButtonFlag.delete"
					>删除</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-refresh-left"
					@click="showRevoke"
					v-if="flowFlag === 1 && (flowStatus === 2 || flowStatus === 4)"
					:disabled="disableButtonFlag.recall"
					>撤回</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-document-checked"
					@click="handleApproval"
					v-if="flowFlag === 1 && (flowStatus === 3 || flowStatus === 4)"
					:disabled="disableButtonFlag.audit"
					>审批</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-document-checked"
					@click="handleAbandon"
					v-if="flowFlag === 1 && abandonFlag"
					:disabled="disableButtonFlag.abandon"
					>弃审</el-button
				>
				<!--保存-->
				<el-button
					type="primary"
					icon="el-icon-document"
					@click="submitForm(3)"
					v-if="flowFlag === 1 && temporaryStorage"
					:disabled="disableButtonFlag.temp"
					>暂存</el-button
				>
				<el-button
					type="primary"
					icon="el-icon-document-checked"
					@click="submitForm(2)"
					v-if="flowFlag === 1 && temporaryStorage"
					:disabled="disableButtonFlag.submit"
					>提交</el-button
				>
			</div>
		</div>
		<!--流程审批-->
		<div class="approval" v-if="approvalVisible">
			<el-form :model="handleForm" label-width="0px">
				<el-form-item>
					<el-radio-group v-model="handleForm.status">
						<el-radio :label="1">同意</el-radio>
						<el-radio :label="2">不同意</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item>
					<el-dropdown trigger="click" @command="handleCommand">
						<span class="el-dropdown-link">
							审批意见
						</span>
					</el-dropdown>
					<el-input type="textarea" :rows="10" placeholder="请输入处理意见" v-model="handleForm.comment">
					</el-input>
				</el-form-item>
				<el-form-item>
					<el-radio-group v-model="handleForm.rejectType" v-if="handleForm.status === 2">
						<el-radio :label="2" :disabled="disableButtonFlag.backFront">退回到上个节点</el-radio>
						<el-radio :label="1" :disabled="disableButtonFlag.backStart">退回到初始节点</el-radio>
					</el-radio-group>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click="approvalVisible = false">取消</el-button>
				<el-button
					type="primary"
					@click="submitForm(1)"
					:disabled="handleForm.status === 2 && disableButtonFlag.backFront && disableButtonFlag.backStart"
					>提交</el-button
				>
			</div>
		</div>
		<!--审批自选-->
		<el-dialog title="请选择" width="500px" :visible.sync="approveOptionalVisible" :close-on-click-modal="false">
			<div>
				<el-table
					:data="approveOptionalList"
					style="width: 100%"
					:show-header="true"
					:max-height="450"
					@selection-change="handleApproveOptionalChange"
				>
					<el-table-column type="selection" width="55"></el-table-column>
					<el-table-column label="全选" prop="name"></el-table-column>
				</el-table>
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="approveOptionalVisible = false">取消</el-button>
				<el-button type="primary" @click="approveOptionalSubmit">提交</el-button>
			</div>
		</el-dialog>
		<!--流程自选-->
		<el-dialog title="请选择" width="500px" :visible.sync="flowOptionalVisible" :close-on-click-modal="false">
			<div>
				<el-table
					:data="flowOptionalList"
					style="width: 100%"
					:show-header="true"
					:max-height="450"
					@selection-change="handleFlowOptionalChange"
				>
					<el-table-column type="selection" width="55"></el-table-column>
					<el-table-column label="全选" prop="label"></el-table-column>
				</el-table>
			</div>
			<div slot="footer" class="dialog-footer">
				<el-button @click="flowOptionalVisible = false">取消</el-button>
				<el-button type="primary" @click="flowOptionalSubmit">提交</el-button>
			</div>
		</el-dialog>
		<!--撤回-->
		<el-dialog title="撤回" width="500px" :visible.sync="revokeVisible" :close-on-click-modal="false">
			<el-form :model="revokeForm" label-width="60px" :rules="formRules" ref="revokeForm">
				<el-form-item label="理由" prop="reason">
					<el-input
						v-model="revokeForm.reason"
						type="textarea"
						:rows="5"
						:maxlength="200"
						show-word-limit
						clearable
						placeholder="请输入理由"
					></el-input>
				</el-form-item>
			</el-form>
			<div slot="footer" class="dialog-footer">
				<el-button @click="revokeVisible = false">取消</el-button>
				<el-button type="primary" @click="handleRevoke">提交</el-button>
			</div>
		</el-dialog>
		<!--警告-->
		<el-dialog class="warn-dialog" title="警告" width="500px" :visible.sync="warnVisible" :close-on-click-modal="false" :modal-append-to-body="false">
			<div slot="title" class="header-title">
				<span style="font-weight: bold">警告&nbsp;</span>
				<i class="el-icon-warning" style="color: orange"></i>
			</div>
			<el-table
					:data="warnTableData"
					:show-header="false"
					stripe
					style="width: 100%">
				<el-table-column
						prop="content"
						label="内容">
					<template slot-scope="scope">
						<div style="font-size: 14px" v-html="scope.row.content"></div>
					</template>
				</el-table-column>
			</el-table>
			<div slot="footer" class="dialog-footer">
				<el-button @click="warnVisible = false">取消</el-button>
				<el-button type="primary" @click="handleWarnSubmit">继续</el-button>
			</div>
		</el-dialog>
	</div>
</template>

<script>
import simplifyForm from '@/views/form/simplify-form'
export default {
	components: {
		simplifyForm,
	},
	data() {
		return {
			action: this.$axios.defaults.baseURL + 'upload/putObject/oss',
			tableData: [],
			form: {},
			calculate: {},
			multiple: {},
			property: {},
			disabled: [],
			editable: [],
			hidden: [],
			handleForm: {
				status: 1,
				comment: '',
				rejectType: 2
			},
			historyJson: [],
			flowFlag: 2,
			abandonFlag: false,
			tableDynamic: {},
			approvalVisible: false,
			flowStatus: 0,
			temporaryStorage: false,
			formDesignType: 0,
			formCofig: {},
			approveOptionalVisible: false,
			approveOptionalList: [],
			approveOptionalSelection: [],
			flowOptionalVisible: false,
			flowOptionalList: [],
			flowOptionalSelection: [],
			revokeVisible: false,
			revokeForm: { reason: '' },
			formRules: {
				reason: [{ required: true, message: '请输入理由', trigger: 'blur' }],
				name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
			},
			textModel: { flag: false, type: 'text' },
			loading: false,
			disableButtonFlag: {
				temp: false,
				submit: false,
				audit: false,
				seaView: false,
				abandon: false,
				backFront: false,
				backStart: false,
				delete: false
			},
			warnVisible: false,
			warnTableData: [],
			warnParams: null,
            activeName: 'first',
            todoList: [],
            todoDoneList: []
		}
	},
	activated() {
		this.reportDetail()
	},
	created() {
		// 将vue实例的方法绑定到window对象中去
		window.warnGoPath = this.warnGoPath
	},
	methods: {
		async reportDetail() {
			this.loading = true
			var params = {
				id: this.$route.query.id,
				formId: this.$route.query.formId
			}
			let res = await this.$axios.get('jellyForm/queryDetail', { params })
			this.loading = false
			if (res.data.code == 200) {
				this.temporaryStorage = res.data.data.temporaryStorage || false
				this.historyJson = JSON.parse(res.data.data.form.historyJson)
                this.getFlowLog()
				if (res.data.data.form.hasOwnProperty('flowId') && res.data.data.form.flowId != null) {
					this.flowFlag = 1
				}
				this.disableButtonFlag = res.data.data.form.disableButtonFlag
				this.form = res.data.data
				this.flowStatus = res.data.data.flowStatus
				this.abandonFlag = res.data.data.abandonFlag
				this.disabled = []
				this.editable = []
				this.hidden = []
				if (this.flowFlag != 1 || (this.flowStatus != 1 && !this.temporaryStorage)) {
					Object.keys(this.form).forEach((field, index) => {
						this.disabled.push(field)
					})
					if (res.data.data.authority) {
						let authorityArray = JSON.parse(res.data.data.authority)
						for (let j = 0; j < authorityArray.length; j++) {
							let item = authorityArray[j]
							if (item.authority === 1) {
								if (item.field) {
									this.editable.push(item.tableName + '.' + item.field)
								} else {
									this.editable.push(item.tableName)
								}
							} else if (item.authority === 3) {
								if (item.field) {
									this.hidden.push(item.tableName + '.' + item.field)
								} else {
									this.hidden.push(item.tableName)
								}
							}
						}
					}
				}

				this.tableData = []
				
				let formDesign = this.form.form.formDesign
				this.formDesignType = formDesign.type
				this.formCofig = JSON.parse(formDesign.excelJson)

				Object.keys(this.form).forEach((field, index) => {
					if (this.formDesignType === 1 && field.indexOf('.') > -1) {
						this.$set(this.form, field.split('.')[0] + '|' + field.split('.')[1], this.form[field])
						delete this.form[field]
					}
					//this.disabled.push(field)
				})

				if (this.formDesignType === 1) {
					for (let j = 0; j < this.formCofig.fieldOptions.length; j++) {
						if (this.formCofig.fieldOptions[j].type === 'editor') {
							this.$set(
								this.form,
								this.formCofig.fieldOptions[j].field,
								JSON.parse(this.form[this.formCofig.fieldOptions[j].field])
							)
						}
					}
				}
			}
		},
		handleApproveOptionalChange(val) {
			let approveOptionalSelection = []
			for (let i = 0; i < val.length; i++) {
				approveOptionalSelection.push(val[i].id)
			}
			this.approveOptionalSelection = approveOptionalSelection
		},
		handleFlowOptionalChange(val) {
			let flowOptionalSelection = []
			for (let i = 0; i < val.length; i++) {
				flowOptionalSelection.push(val[i].id)
			}
			this.flowOptionalSelection = flowOptionalSelection
		},
		handleProcess() {
			this.$router.push({
				path: '/flowDisplay',
				query: {
					businessKey: this.$route.query.id,
					businessType: this.$route.query.formId,
					title: this.$route.query.title
				}
			})
		},
		handleCommand(command) {
			this.handleForm.comment = command
		},
		statusFormatter(row) {
			if (row.status == 1) {
				return '同意'
			} else if (row.status == 2) {
				return '不同意'
			} else if (row.status == 3) {
				return '已阅'
			} else if (row.status == 4) {
				return '撤回'
			} else if (row.status == 5) {
				return '重新发起'
			} else if (row.status == 6) {
				return '弃审'
			} else if (row.status == 7) {
				return '关闭'
			} else if (row.status == 8) {
				return '激活'
			} else if (row.status == 0) {
                return '待办'
            }
		},
		//撤回界面
		showRevoke() {
			this.revokeVisible = true
			if (this.$refs.revokeForm) {
				this.$refs.revokeForm.resetFields()
			}
		},
		//撤回
		handleRevoke() {
			let that = this
			var params = {
				businessType: this.$route.query.formId,
				businessKey: this.$route.query.id,
				reason: this.revokeForm.reason
			}
			this.$refs.revokeForm.validate(valid => {
				if (valid) {
					that.$axios.post('flow/revoke', params).then(res => {
						if (res.data.code == 200) {
							that.revokeVisible = false
							that.$message.success('撤回成功')
							that.$store.commit('worktabRemove', that.$route.fullPath)
						} else {
							that.$message.error(res.data.message)
						}
					})
				}
			})
		},
		//弃审
		handleAbandon() {
			var params = {
				businessType: this.$route.query.formId,
				businessKey: this.$route.query.id
			}
			let that = this
			that.loading = true
			that.$axios.post('flow/abandon', params).then(res => {
				that.loading = false
				if (res.data.code == 200) {
					that.$message.success('弃审成功')
					that.$store.commit('worktabRemove', that.$route.fullPath)
				} else {
					that.$message.error(res.data.message)
				}
			})
		},
		//显示审批框
		handleApproval() {
			if (this.disableButtonFlag.backFront && !this.disableButtonFlag.backStart) {
				this.handleForm.rejectType = 1
			}
			this.approvalVisible = true
		},
		//打印
		handlePrint() {
			window.open(window.platform.url + 'upload/print/' + this.form.form.detailExportPath)
		},
		//删除
		handleDelete() {
			let that = this
			var params = {
				businessType: this.$route.query.formId,
				businessKey: this.$route.query.id
			}
			that.$axios.post('jellyForm/deleteCustom', params).then(res => {
				if (res.data.code == 200) {
					that.$message.success('删除成功')
					that.$store.commit('worktabRemove', that.$route.fullPath)
				} else {
					that.$message.error(res.data.message)
				}
			})
		},
		approveOptionalSubmit() {
			if (this.approveOptionalSelection.length === 0) {
				this.$message.warning('请选择节点执行人')
			} else {
				this.approveOptionalVisible = false
				this.submitForm(1)
			}
		},
		flowOptionalSubmit() {
			if (this.flowOptionalSelection.length === 0) {
				this.$message.warning('请选择流程节点')
			} else {
				this.flowOptionalVisible = false
				this.submitForm(1)
			}
		},
		//1:审批、2:提交、3:暂存
		submitForm(type) {
			this.approvalVisible = false
			let that = this
			var params = {
				businessType: this.$route.query.formId,
				businessKey: this.$route.query.id
			}
			let temporaryStorage = false
			if (type === 1) {
				//审批
				params.status = this.handleForm.status
				params.comment = this.handleForm.comment
				params.rejectType = this.handleForm.rejectType
				params.isAudit = true
				var result = false
				if (this.formDesignType == 1) {
					result = this.$refs.simplifyForm.validate()
				} else {
					result = this.$refs.seniorForm.validate()
				}
				if (!result) {
					return
				}
			} else if (type === 2) {
				//提交
				params.status = 1
				var result = false
				if (this.formDesignType == 1) {
					result = this.$refs.simplifyForm.validate()
				} else {
					result = this.$refs.seniorForm.validate()
				}
				if (!result) {
					return
				}
			} else if (type === 3) {
				//暂存
				temporaryStorage = true
				params.status = 1
				if (this.flowFlag === 1 && this.flowStatus === 1) {
					params.existProdef = true
				}
			}

			params = Object.assign(params, this.form)

			Object.keys(params).forEach((key, index) => {
				let property = this.property[key]
				if (property) {
					if (
						(property.type === 'checkbox' ||
							property.type === 'select' ||
							property.type === 'department' ||
							property.type === 'member' ||
							property.type === 'business' ||
							property.type === 'cascader') &&
						property.multiple
					) {
						params[key] = params[key].toString()
					}
					if (
						property.type === 'picture' ||
						property.type === 'upload' ||
						property.type === 'table' ||
						property.type === 'area'
					) {
						params[key] = JSON.stringify(params[key])
					}
				}
				if (params[key] instanceof Array || params[key] instanceof Object) {
					params[key] = JSON.stringify(params[key])
				}
				if (key.indexOf('|') > -1) {
					params[key.split('|')[0] + '.' + key.split('|')[1]] = params[key]
					delete params[key]
				}
			})

			if (this.approveOptionalSelection.length > 0) {
				params['approverOptionalList'] = this.approveOptionalSelection.toString()
			}

			if (this.flowOptionalSelection.length > 0) {
				params['flowOptionalList'] = this.flowOptionalSelection.toString()
			}

			// 避免form表单temporaryStorage覆盖
			params.temporaryStorage = temporaryStorage

			delete params['form']

			that.loading = true
			that.$axios.post('jellyForm/updateCustom', params).then(res => {
				that.loading = false
				if (res.data.code == 200) {
                    this.approveOptionalSelection = []
                    this.flowOptionalSelection = []
					that.$message.success('提交成功')
					that.$store.commit('worktabRemove', that.$route.fullPath)
				} else if (res.data.code == 10004) {
					// 审批人自选
					that.approveOptionalList = JSON.parse(res.data.message)
					that.approveOptionalVisible = true
				} else if (res.data.code == 10009) {
					// 流程手动选择
					that.flowOptionalList = JSON.parse(res.data.message)
					that.flowOptionalVisible = true
				} else if (res.data.code == 10011) {
					// 提示窗
					that.warnTableData = JSON.parse(res.data.message)
					that.warnParams = params
					that.warnVisible = true
				} else {
					that.$message.error(res.data.message)
				}
			})
		},
		handleWarnSubmit() {
			let that = this
			var params = that.warnParams
			params.verified = true // 是否已经验证
			that.loading = true
			that.$axios.post('jellyForm/updateCustom', params).then(res => {
				that.loading = false
				if (res.data.code == 200) {
					that.$message.success('提交成功')
					that.$store.commit('worktabRemove', that.$route.fullPath)
					that.warnVisible = false
				} else if (res.data.code == 10004) {
					// 审批人自选
					that.approveOptionalList = JSON.parse(res.data.message)
					that.approveOptionalVisible = true
					that.warnVisible = false
				} else if (res.data.code == 10009) {
					// 流程手动选择
					that.flowOptionalList = JSON.parse(res.data.message)
					that.flowOptionalVisible = true
					that.warnVisible = false
				} else {
					that.$message.error(res.data.message)
				}
			})
		},

		// 路由跳转，供警告弹窗使用
		warnGoPath(path, query) {
			this.$router.push({
				path: path,
				query: query
			})
		},

        // 待处理、审批日志流程审批日志
        getFlowLog() {
            let that = this
            var params = {
                businessKey: this.$route.query.id,
                businessType: this.$route.query.formId
            }
            that.$axios.get('flow/queryFlowTodoList', { params }).then(res => {
                that.loading = false
                if (res.data.code == 200) {
                    this.todoList = res.data.data
                    this.todoDoneList = []
                    if (this.todoList.length !== 0){
                        for(let i=0;i<this.todoList.length;i++) {
                            this.todoDoneList.push(this.todoList[i])
                        }
                    }
                    if (this.historyJson.length !== 0){
                        for(let j=0;j<this.historyJson.length;j++) {
                            this.todoDoneList.push(this.historyJson[j])
                        }
                    }
                } else {
                    that.$message.error(res.data.message)
                }
            })
        },
	}
}
</script>
<style scoped>
::v-deep .el-dialog__body {
	padding: 5px 20px 0px 20px;
}
.approval {
	position: fixed;
	top: 0;
	right: 0;
	width: 324px;
	height: 100%;
	z-index: 2000;
	background-color: #fff;
	box-sizing: border-box;
	box-shadow: 0 8px 10px -5px rgb(0 0 0 / 20%), 0 16px 24px 2px rgb(0 0 0 / 14%), 0 6px 30px 5px rgb(0 0 0 / 12%);
	padding: 15px;
}
.container {
	padding: 5px 0px 45px 5px;
}
.footer {
	position: fixed;
	left: 230px;
	bottom: 0px;
	width: 100%;
	background: #fff;
	box-shadow: 0 2px 12px 0 rgb(0 0 0 / 10%);
	height: 65px;
	border-bottom: 1px solid #ebeef5;
	box-sizing: border-box;
	border-top: 1px solid #ebeef5;
	z-index: 2000;
}
.footer-right {
	position: fixed;
	bottom: 0px;
	right: 15px;
	padding: 10px;
}
::v-deep .warn-dialog .el-dialog__header {
	background: #f3f1f1;
	border-top-left-radius: 10px;
	border-top-right-radius: 10px;
	padding: 18px 18px 10px 18px;
}
::v-deep .warn-dialog .el-dialog__footer {
	border-bottom-left-radius: 10px;
	border-bottom-right-radius: 10px;
	padding-bottom: 10px
}
</style>
