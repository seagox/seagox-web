<template>
	<div>
		<div class="searchView">
			<el-form label-width="80px" :inline="true">
				<el-form-item label="标题：">
					<el-input v-model="searchContent.title" placeholder="请输入标题" clearable> </el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" icon="el-icon-search" @click.native="handleSearch">查询</el-button>
				</el-form-item>
			</el-form>
		</div>
		<div class="table">
			<!--列表-->
			<el-table :data="tableData" border stripe @row-dblclick="goDetail" max-height="650">
				<el-table-column prop="name" label="标题" align="center" show-overflow-tooltip></el-table-column>
				<el-table-column
					prop="assigneeName"
					label="发起人"
					align="center"
					show-overflow-tooltip
				></el-table-column>
				<el-table-column
					prop="createTime"
					label="发起时间"
					align="center"
					show-overflow-tooltip
				></el-table-column>
				<el-table-column
					prop="handleTime"
					label="处理时间"
					align="center"
					show-overflow-tooltip
				></el-table-column>
				<el-table-column
					prop="currentToDoPersons"
					label="当前待办人"
					align="center"
					show-overflow-tooltip
				></el-table-column>

				<el-table-column label="操作" align="center">
					<template slot-scope="scope">
						<el-button type="text" size="small" @click="handleProcess(scope.row)">流程查看</el-button>
					</template>
				</el-table-column>
			</el-table>
			<!--分页-->
			<div class="pagination">
				<el-pagination
					background
					@current-change="handleCurrentChange"
					layout="total, prev, pager, next"
					:page-size="pageSize"
					:current-page.sync="pageNo"
					:total="total"
				>
				</el-pagination>
			</div>
		</div>
	</div>
</template>
<script>
export default {
	name: 'DoneItem',
	data() {
		return {
			searchContent: {
				title: ''
			},
			tableData: [],
			pageNo: 1,
			pageSize: 10,
			total: 0
		}
	},
	mounted() {
		this.queryByPage()
	},
	methods: {
		goDetail(row) {
			this.$router.push({
				path: '/handleCustomForm',
				query: {
					id: row.businessKey,
					formId: row.businessType,
					title: row.name
				}
			})
		},
		// 流程查看
		handleProcess(row) {
			this.$router.push({
				path: '/flowDisplay',
				query: {
					businessKey: row.businessKey,
					businessType: row.businessType,
					title: row.name
				}
			})
		},
		queryByPage() {
			let params = {
				pageNo: this.pageNo,
				name: this.searchContent.title
			}
			this.$axios.get('flow/queryDoneItemByPage', { params }).then(res => {
				if (res.data.code === 200) {
					this.tableData = res.data.data.list
					this.total = res.data.data.total
					this.pageSize = res.data.data.pageSize
				} else {
					this.$message.error(res.data.message)
				}
			})
		},
		handleSearch() {
			this.queryByPage()
		},
		handleCurrentChange() {
			this.queryByPage()
		}
	}
}
</script>
