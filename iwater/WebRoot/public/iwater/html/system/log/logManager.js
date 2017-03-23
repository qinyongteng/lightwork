/**
 *  对于加载菜单管理的逻辑处理
 *  code by diana 2017.1.16
 */
define(["util","avalon"],function (util,avalon) {
	
	var menuselect = require(['./core/javascripts/components/lightwork.menuselect']);
	var tablelist = require(['./core/javascripts/components/lightwork.table']);
	var displayRow = 10;  // 设置列表显示的默认显示的行数
	var pager = require(['./core/javascripts/components/lightwork.pager']);
	 // 查询条件接口
	var ajax={
		menu_query:'./public/iwater/config/log_query.json',
		table_query:'./system/log/list?param='+encodeURI('{"pageNo":"1","pageSize":"'+displayRow+'"}'),
		download_query:'./system/log/download',
		menu_del:'./system/log/del'
	};
	
	// 创建菜单对应的模型库
	var vm = avalon.define({
		$id:"log_query",
		menu:[],
		num:3,
		totalCount:0,
		query_item:'',    /*查询条件  默认为空  代表全查*/
		queryList:function(e){ // 查询的处理逻辑
			vm.query_item=util.get_query_list();
			window.location.hash = location.hash.replace('page=' + util.getHashStr("page"), 'page=' + 1);
			vm_page.currentPage=1;
			ajax.table_query='./system/log/list?param'+encodeURI('={"pageNo":1,"pageSize":"'+displayRow+'"}');
			// 更改当前页码，顺序不能变	      	  
	      	getGridData();  //重新初始化页面
			//alert(JSON.stringify(stk));
		},
		downloadLog:function(){  //自定义方法  导出菜单
			var the_item=JSON.stringify(util.get_query_list());
			var url=ajax.download_query;
			//创建form
			var form=$('<form></form>');
			//设置表单属性
			form.attr('action',url);
			form.attr('method','post');
			form.attr('target','_self');
			
			//创建input
			var my_input=$('<input type="text" name="param" />');
			var m_input=$('<input type="text" name="params" />');
			my_input.attr('value',the_item);
			m_input.attr("value","{pageNo:"+vm_page.currentPage+",pageSize:"+displayRow+"}");
			//附加到form
			form.append(my_input);
			form.append(m_input);
			form.submit();
			//注意return  false取消链接的默认动作
			return false;
	    },
		clearAll:function(e){  // 清空选项
			// 对check框的处理    有bug
			/*vm.menu.forEach(function (el) {
				el.subQuery.forEach(function (elm) {
					if(elm.hasOwnProperty("ischecked"))
						 elm.ischecked = "";
	            });
            });*/
			
			//针对特定的checkbox
			$("input[data-key='power_type']").each(function() { 
				$(this).attr("checked", false); 
			}); 
			// 对input 输入框的处理
			$("input[type='text']").val("");
		}
	});
	
	
	// 创建列表对应的模型库
	var vm_table = avalon.define({
		$id:'log_list',		
		gridZhColumns: ['主键','日志用途','添加时间','操作人名称','操作者IP'],
		gridEnColumns: ['ui_id','log_desc','add_date','log_user',"log_IP"],
		isHandle:true,
		keyColumn:'ui_id',
		handleData:[{icon:'btn_lookUp',text:'查看',key:'find'},{icon:'btn_del',text:'删除',key:'del'}],
		gridData: [],
		findEvent:function(stk){
			window.location.href="#!/log/findLog?type=find&ui_id="+stk;
        	/*if(skz=='页面'){   //页面资源
        		//修改url地址实现页面的跳转
            	window.location.href="#!/log/addPage?type=find&ui_id="+stk;
        	}
        	if(skz=='接口'){  //接口资源
        		window.location.href="#!/power/addInterface?type=upd&flag=1&ui_id="+stk;
        	}
        	if(skz=='菜单'){  //菜单资源
        		window.location.href="#!/power/addInterface?type=upd&flag=2&ui_id="+stk;
        	}*/
        },
        delEvent:function(stk){
//        	var flag=confirm("确定删除吗?");
//        	if(flag){
//        		data_del(stk);
//        	}
        	util.layerConfirm("确定删除吗？",function(){data_del(stk);});
    		/*util.confirm("确定删除吗?",function(result){
    		alert(result);
    		},"300px");*/
        },
        cbProxy:function(e,k,index){ 
        	avalon.log(k);
        	//获得主键
        	var stk=$("td[name='ui_id']")[index].innerHTML;  //主键
        	//var skz=$("td[name='power_type']")[index].innerHTML;	//资源类型
        	if($(e.target).text()=='查看'){
        		vm_table.findEvent(stk);
        	}
        	if($(e.target).text()=='删除'){
        		vm_table.delEvent(stk);
        	}
        	//ie 不兼容
        	/*if(e.toElement.innerHTML=='修改'){
        		vm_table.updateEvent(stk);
        	}
        	if(e.toElement.innerHTML=='删除'){
        		vm_table.delEvent(stk);
        	}*/
        }
	});
	
	
	//进行删除
	function data_del(ui_id){
		var stk={'ui_id':ui_id};
		util.post(ajax.menu_del,stk,function(result) {
			 //这里需要注意的是由于 post方式返回的是json字符串“” 所以要进行转换
			 var aJson=eval("("+result+")");
			 if(aJson.code=="0"){
				 util.layerMsg("删除成功");
				 getGridData();    //将表单初始化
			 }
			 else{
				 util.layerMsg(result.message);
			 }
		 });
	}
	
	// 创建分页所需的的模型库
	var vm_page = avalon.define({		
		$id:'log_pager',
		showPages:0,   //显示的页标  
		totalPages:0,	 //初始总页数
		currentPage:1,  //当前页数
		onPageClick:function(e,cur){
			//alert(util.getHashStr("page"));  //通过得到url上键为page的值 来得到新的页码
			//重新修改请求路径  并进行请求
			ajax.table_query='./system/log/list?param'+encodeURI('={"pageNo":"'+cur+'","pageSize":"'+displayRow+'"}');
			vm_page.currentPage=cur;
			getGridData();
		}
	});
	
	 // 从接口处获取具体的查询条件信息
    util.getJson(ajax.menu_query,{},function(result) {
          // 根据具体情况修改错误代码
          var aJson= result[0];          
          if(aJson.code == "0" ){
        	  vm.menu = aJson.data;
        	  // 更新数据后，刷新视图
        	  //avalon.scan(document.body);        	  
	       }
	       else
	    	  util.layerMsg(aJson.msg);
	 }); 
    
    
    // 从接口处获取具体的列表信息---
    function getGridData(){
    	//avalon.log(JSON.stringify());
	    util.post(ajax.table_query,vm.$model.query_item,function(result) {
	    	var aJson=eval("("+result+")");
	        if(aJson.code == "0" ){
	          //下面的代码是针对具体的分页显示情况作调整
	          if(vm_page.showPages>aJson.pageInfo.totalPage){  //当实际页数少于当前设置页数
	        	vm_page.showPages=aJson.pageInfo.totalPage;
	          }
	          if(vm_page.showPages<aJson.pageInfo.totalPage){  //当实际页数多于当前页数时
	        	  if(aJson.pageInfo.totalPage<=5){             //实际页数小于等于5
	        		  vm_page.showPages=aJson.pageInfo.totalPage;
	        	  }
	        	  else{							               //实际页数大于5
	        		  vm_page.showPages=5;
	        	  }
	          }
	          vm_page.totalPages=aJson.pageInfo.totalPage;   //修改页面显示的总页数
	          vm.totalCount=aJson.pageInfo.totalCount;  	 //修改页面显示的总记录数
	          
	      	  vm_table.gridData = aJson.data;
	      	  // 更新数据后，刷新视图
	      	  //avalon.scan(document.body); 
	      	  
		    }
		    else
		      util.layerMsg(aJson.message);
		 });
    }
    
    //初始化显示页面
    getGridData();
});