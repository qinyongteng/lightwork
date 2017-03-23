/**
 *  新增菜单的跳转
 */

define(['avalon','util','md5'],function(avalon,util){
	// 获取页面的类型
	var page_type = util.getHashStr("type");
	// 获取传入的参数
	var params = {};
	
	var ajax ={
		menu_query:'./system/menu/parentMenu',	/*相当于查询*/
		add_submit:'./system/power/create', /*相当于add的提交事件*/
		query:'./system/menu/menuItem',    /*一般的查询*/
		update_query:'./system/power/get', /*相当于查询*/
		check_only:'./system/power/checkOnly',   /*验证唯一性*/
		update_submit:'./system/power/update',/*相当于update的提交事件*/
		del:''
	};
	
	avalon.validators.sysPower_addInterface_token = {   
            message: '必须由字母和数字组成，6-12位',
            get: function (value, field, next) {
               //想知道它们三个参数是什么,可以console.log(value, field,next)
                var parttern=/^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,12}$/;
                $("#showToken").html("");
            	if(!parttern.test(value)){
                	next(false);
                }
                else{     //在正确的情况下生成对应的token字符串
                	next(true);
                	$("#showToken").html(hex_md5(vm.power_token).substring(12,28));
                }
                return value;
            }
    };
	
	 avalon.validators.sysPower_addInterface_item = {   //自定义'所属项目'验证
             message: '必选',
             get: function (value, field, next) {
                //想知道它们三个参数是什么,可以console.log(value, field,next)
                 var ok = ((Number(value) != 0));
                 next(ok);
                 return value;
             }
     };
	
		avalon.validators.sysPower_addInterface_code = {   //自定义账号验证规则
	            message: '请填写唯一的代码',
	            get: function (value, field, next) {
	                if(value==''){
	                	next(false);
	                }
	                else{    //验证唯一性
	                	var stk={};
	                	if(page_type=='upd'){
	                		stk={'ui_id':vm.ui_id,"power_code":vm.power_code};
	                	}
	                	if(page_type=='add'){
	                		stk={'ui_id':'',"power_code":vm.power_code};
	                	}
	                	util.post(ajax.check_only,stk,function(result) {
	           			 //这里需要注意的是由于 post方式返回的是json字符串“” 所以要进行转换
	           			 var aJson=eval("("+result+")");
	           			 if(aJson.code=="0"){
	           				 if(aJson.data=="0"){
	           					 next(true);
	           				 }
	           				 else{
	           					 next(false);
	           				 }
	           			 }
	           			 else{
	           				 next(false);
	           				 util.layerMsg(aJson.message);
	           			 }
	           		   });
	                }
	                return value;
	            }
	    };
	
	/* 创建添加或者删除的模型库*/
	var vm = avalon.define({
		$id:'inter_form',
		reset_flag:false,  /*重置操作标志位   完成判断后及时置为false*/
		ui_id:'',      /*主键*/
		power_type:'001',     /*默认是接口资源001*/
		power_showType:'',   /*注册接口资源 or  修改接口资源  or 注册菜单资源 or 修改菜单资源*/
		menu_project:'',  /*所属项目下拉*/
		power_prefix:'0',  /*所属项目*/
		power_name:'',   /*权限名称*/
		power_code:'',	/*权限代码*/
		power_url:'',	/*权限路径*/
		power_token:'',  /*接口token*/
		sysPower_addInterface_item:'',	/*自定义 校验  必选*/
		sysPower_addInterface_code:'',  /*自定义校验  唯一性*/
		sysPower_addInterface_token:'', /*自定义校验 验证token*/
		validate:{  // 校验方法
			onError: function (reasons) {                          //单个验证失败时触发
                reasons.forEach(function (reason) {
                	//进行提示
                	var a=document.getElementsByName(reason.element.name)[0].parentNode.lastChild;
                	a.innerHTML=reason.getMessage();
                	//alert(reason.getMessage());
                	//avalon.log(this);
                    console.log(reason.getMessage());
                });
            },
            onSuccess:function(reasons, event){       // 针对表单内单个的元素
            	reasons.forEach(function (reason) {
                	var a=document.getElementsByName(reason.element.name)[0].parentNode.lastChild;
                	a.innerHTML='';    
                });
            },            
            onValidateAll: function (reasons) {
                if (reasons.length) {
                	reasons.forEach(function (reason) {
                    	//进行提示
                    	var a=document.getElementsByName(reason.element.name)[0].parentNode.lastChild;
                    	a.innerHTML=reason.getMessage();
                        console.log(reason.getMessage());
                    });
                    avalon.log('有表单没有通过');
                } else {
                	avalon.log('通过验证');
                	submitData();
                }
            }
		},
		save:function(){
			this.validate.onManual();
		},
		reset:function(){
			vm.reset_flag=true; 
			initPageData();
		}
	});
	
	
	avalon.scan(document.body);
	/* 创建添加或者删除的模型库*/
	
	/* 获取数据对模型操作 ，表单初始化
	 * 1.添加初始化= 添加重置
	 * 2.修改初始化
	 * 3.修改重置(与2不同：获得主键的方式)
	 */
	var  initPageData =function(){
		//初始化'page_type'  全局依赖此变量判断
		var type_flag=util.getHashStr("type");
		if(type_flag!='' && type_flag!=undefined){
			page_type=type_flag;
		}
		set_form_data();
	}
	
	//初始化  表单数据
	function set_form_data(){
		 //sel_project();   //初始化 '所属项目'下拉
		
		vm.power_prefix='0';  /*所属项目*/
		vm.power_name='';   /*权限名称*/
		vm.power_code='';	/*权限代码*/
		vm.power_url='';	/*权限路径*/
		vm.power_token='';  /*权限token*/
		$("#showToken").html('');
		$('input[name=power_code]').removeAttr("disabled");//去除input元素的readonly属性
		
  	   if(page_type=="add"){
  		  vm.power_showType='注册接口资源';
  		  sel_project(0);          //'所属项目'下拉生成
  		  vm.reset_flag=false;      					//将标志及时还原
  	   }
  	   if(page_type=="upd"){  
  		  vm.power_showType='接口资源维护';
  		  var stk='';
  		  $('input[name=power_code]').attr("disabled","disabled");//将input元素设置为readonly
  		  if(vm.reset_flag){  		                   //修改页面的重置
  			stk={'ui_id':vm.ui_id};
  			vm.reset_flag=false;      					//将标志及时还原
  		  }
  		  else{				  		                   //修改页面的初始化	
  			stk={'ui_id':util.getHashStr("ui_id")};
  		  }
  		  
  		  //修改前赋值
  		  util.post(ajax.update_query,stk,function(result) {
			 var aJson=eval("("+result+")");
			 if(aJson.code=="0"){
				 var json_data=aJson.data;
				 for(key in json_data){
					 if(typeof vm[key] != "undefined" 
							  && key !="power_owner" && key!="power_prefix"){
						 vm[key]=json_data[key];
					 }
				 }
				 sel_project(json_data.power_prefix);             //'所属项目'下拉生成
				 if(vm.power_token!=''){
					 $("#showToken").html(hex_md5(vm.power_token).substring(12,28)); //使用md5显示密文
				 }
			}
			 else{
				 util.layerMsg(aJson.message);
			 }
  		  });
  		  
  	   }

	}
	
	
	/*
	 * 这里进行备注:  
	 * 级联页面不使用ms-click  原因: 用户体验差，点击时选项会发生闪变
	 *             ms-change 原因: 获得的是之前选中的值，不符合需要
	 */
	

	/* 传出模型的数据操作  */
	function submitData(){
		// 获得表单内全部元素
		
		var stk=JSON.parse(JSON.stringify(vm.$model));
		avalon.log(JSON.parse(JSON.stringify(vm.$model)));
		var tip='';
		var url='';
		if(page_type=='add'){
			tip='添加成功';
			url=ajax.add_submit;
		}
		if(page_type=='upd'){
			tip='修改成功';
			url=ajax.update_submit;
		}
		 util.post(url,stk,function(result) {
			 //这里需要注意的是由于 post方式返回的是json字符串“” 所以要进行转换
			 var aJson=eval("("+result+")");
			 if(aJson.code=="0"){
				 util.layerMsg(tip);
				 if(page_type=='add'){
					 initPageData();    //将表单初始化
				 }
			 }
			 else{
				 util.layerMsg(aJson.message);
			 }
		 });
		
	}
	
	/*  //vm中值清空
	   for (key in JSON.parse(JSON.stringify(vm.$model))){ 
			if(typeof vm.$model[key] === "string" )
				vm[key] = '';
			if(typeof vm.$model[key] === "boolean")
				vm[key] = false;
		}
	 */
		
		
	/*
	 * '所属项目'  下拉生成 和 值选定
	 */
	function sel_project(the_item_prefix){
		util.getJson(ajax.query,{},function(result){
	          var aJson= result;  
	          if(aJson.code == "0" ){
	        	  var data=aJson.data;
	        	  var dataArray=[];    //组合形成数组
	        	  var i=1;
	        	  dataArray[0]={'project_name':'--请选择--','project_value':0};
	        	  for(var obj in data){
	        		  dataArray[i]={'project_name':data[obj],'project_value':data[obj]};
	        		  i++;
	        	  }
	        	  vm.menu_project=dataArray;
	        	  vm.power_prefix=the_item_prefix;
	        	  // 更新数据后，刷新视图
	          	  avalon.scan(document.body);
		       }
		       else
		    	  util.layerMsg(aJson.message);
		});
	}
	
	
	return {
		//这里写法固定  lightwork.route.js会默认调用完成页面初始化
		initPageData:initPageData       
	}
});