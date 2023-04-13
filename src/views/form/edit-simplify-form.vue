<template>
	<el-dialog
		title="编辑"
		width="750px"
		:visible.sync="formVisible"
		:close-on-click-modal="false"
		@close="handleClose"
	>
		<simplify-form
			ref="simplifyForm"
			:action="action"
			:formModel="formModel"
			:formCofig="formCofig"
			:property="property"
			:calculate="calculate"
			:textModel="textModel"
		/>
		<div slot="footer" class="dialog-footer">
			<el-button @click="formVisible = false">取消</el-button>
			<el-button type="primary" @click="submitForm">提交</el-button>
		</div>
	</el-dialog>
</template>

<script>
import simplifyForm from '@/views/form/simplify-form'
export default {
	components: {
		simplifyForm
	},
	data() {
		return {
			formVisible: false,
			action: this.$axios.defaults.baseURL + 'upload/putObject/oss',
			formModel: {},
			formCofig: {},
			property: {},
			calculate: {},
			formId: '',
			id: '',
			textModel: { flag: false, type: 'text' }
		}
	},
	methods: {
		showEditDialog(formId, id) {
			this.formId = formId
			this.id = id
			this.reportDetail(formId, id)
		},
		async reportDetail(formId, id) {
			var params = {
				id: id,
				formId: formId
			}
			let res = await this.$axios.get('jellyForm/queryDetail', { params })
			if (res.data.code == 200) {
				this.formModel = res.data.data
				this.formCofig = JSON.parse(this.formModel.designJson)
				this.formVisible = true
			}
		},
		handleClose() {
			this.$refs.simplifyForm.resetForm()
		},
		submitForm() {
			var params = {
				businessType: this.formId,
				businessKey: this.id
			}

			//表单验证
			let result = this.$refs.simplifyForm.validate()
			if (!result) {
				return
			}

			params = Object.assign(params, this.formModel)

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
			})

			Object.keys(params).forEach((key, index) => {
				if (key.indexOf('|') > -1) {
					params[key.split('|')[0] + '.' + key.split('|')[1]] = params[key]
					delete params[key]
				}
			})

			delete params['form']

			this.$axios.post('jellyForm/updateCustom', params).then(res => {
				if (res.data.code == 200) {
					this.$message.success('编辑成功')
					this.formVisible = false
					this.$emit('submit')
				} else {
					this.$message.error(res.data.message)
				}
			})
		}
	}
}
</script>
