/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
/**
 * Description: This script will be used to update the amount value on the SO and Invoice record.
 * 
 * version  : 1.0.0 - initial version
 * author       : Plative/Pragati Vhanmore
 * date     : 12/08/2024
 */
define(['N/record', 'N/search', 'N/format', 'N/runtime'],

  function(record, search, format, runtime) 
  {
  function beforeLoad(context)
  {
    try 
    {
      var newRecord = context.newRecord;
              var obj_record = context.newRecord;
              var record_type = obj_record.type;
              var form = context.form;
              
      if (context.type === context.UserEventType.COPY) 
      {
        var lineCount = newRecord.getLineCount({sublistId: 'item'});
        for (var i = 0; i < lineCount; i++) 
        {
          newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol_pla_line_to_update',line: i,value: ''});
        }
      }
      
              if(context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT)
              {
                  var fieldId = 'custitempla_forrental';
                  var field = form.getField({ id: fieldId });
                  if (field && record_type != 'serializedinventoryitem') 
                  {
                      field.updateDisplayType({ displayType: 'disabled'}); 
                  }
                  else
                  {
                  }
              }
              if(record_type == 'itemfulfillment' || record_type == 'returnauthorization' || record_type == 'invoice')
              {
                  var rental_st_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_rental_start_date'});
                  if (rental_st_Dt) 
                  {
                      rental_st_Dt.updateDisplayType({ displayType: 'disabled'});
                  }

                  var expected_st_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_actual_start_date'});
                  if (expected_st_Dt) 
                  {
                      expected_st_Dt.updateDisplayType({ displayType: 'disabled'});
                  }

                  var rental_et_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_rental_end_date'});
                  if (rental_et_Dt) 
                  {
                      rental_et_Dt.updateDisplayType({ displayType: 'disabled'});
                  }

                  var expected_et_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_actual_end_date'});
                  if (expected_et_Dt) 
                  {
                      expected_et_Dt.updateDisplayType({ displayType: 'disabled'});
                  }         
              }
              if(record_type == 'salesorder')
              {
                  var rental_st_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_actual_start_date'});
                  if (rental_st_Dt) 
                  {
                      rental_st_Dt.updateDisplayType({ displayType: 'disabled'});
                  }

                  var rental_et_Dt = form.getSublist({id: 'item' }).getField({id: 'custcol_pla_actual_end_date'});
                  if (rental_et_Dt) 
                  {
                      rental_et_Dt.updateDisplayType({ displayType: 'disabled'});
                  }
              }
          }
          catch(e)
          {
              log.error('Exception Caught Before load:===',e);
          }
      }

//This function will update the dates on the SO and Invoice and as per that it updates the maount at the line level.
   function beforeSubmit(scriptContext) 
   {
      //try
      {	
    var s_type = scriptContext.type;
          var SO_obj = scriptContext.newRecord;
          var record_type = SO_obj.type;
          if(record_type == 'salesorder')
          {
              if(s_type != 'delete' && s_type != 'approve')
              {
        var maxExistingLineNo = 0;
                  var numLines = SO_obj.getLineCount({sublistId:"item"});
                  log.debug('numLines SO:===',numLines);
                  if(numLines>0)
                  {
                      for (var i=0; i<numLines; i++)
                      {
                          var rental_start_date = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_start_date',line: i});
                          var rental_end_date = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_end_date',line: i});
                          var ac_st_date = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_actual_start_date',line: i});
                          var ac_end_date = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_actual_end_date',line: i});
                          
                          log.debug('rental_start_date:===',rental_start_date+'===rental_end_date:==='+rental_end_date);
                          var b_rental = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item', line:i});
                         
                          if(b_rental && (!rental_start_date || !rental_end_date))
                          {
                              throw "Please enter the Expected rental start and end dates for this line.";
                          }
                          if(!b_rental && (rental_start_date || rental_end_date))
                          {
                              throw "No need to enter the Expected rental start and end dates for this line.";
                          }
                          if(rental_start_date && rental_end_date && (!ac_st_date || !ac_end_date))
                          {
                              var start = new Date(rental_start_date);
                              var end = new Date(rental_end_date);
                      
                              if (end <= start) 
                              {
                                  throw "Rental End Date must be greater than Start Date.";
                              }
                              var rate = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'rate',line: i});
                              var qty = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: i});
                              var days = find_no_of_days(rental_end_date, rental_start_date);
                              var original_rate = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_original_rate',line: i});
                              log.debug('rate:===',rate+'===qty:==='+qty);
      
                              if(days)
                              {
                                  if(original_rate)
                                  {
                                      rate = original_rate;
                                  }
                                  var updated_amt = parseFloat(rate) * parseFloat(qty) * parseFloat(days);
                                  var new_rate = parseFloat(updated_amt)/parseFloat(qty);
                         
                                  log.debug('updated_amt:==',updated_amt+'===days:==='+days);
                                  SO_obj.setSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_duration', line: i, value:parseInt(days)});
                                  SO_obj.setSublistValue({sublistId: 'item',fieldId: 'rate', line: i, value: parseFloat(new_rate).toFixed(2)});
                                  SO_obj.setSublistValue({sublistId: 'item',fieldId: 'custcol_pla_original_rate', line: i, value: parseFloat(rate).toFixed(2)});
                                  //SO_obj.setSublistValue({sublistId: 'item',fieldId: 'amount', line: i, value: parseFloat(updated_amt).toFixed(2)});
                              }
                          }
            var existingLineNo = SO_obj.getSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_line_to_update', line: i });
            if (existingLineNo) 
            {
              existingLineNo = parseInt(existingLineNo, 10);
              if (existingLineNo > maxExistingLineNo) 
              {
                maxExistingLineNo = existingLineNo;
              }
            }
                      }
          for (var j = 0; j < numLines; j++) 
          {
            var currentLineNo = SO_obj.getSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_line_to_update',line: j });
            if (!currentLineNo) 
            {
              maxExistingLineNo++;
              SO_obj.setSublistValue({  sublistId: 'item', fieldId: 'custcol_pla_line_to_update', line: j,value: maxExistingLineNo });
            }
          }
                  }
              }
    }
      }
      try
      {
    if(s_type != 'delete' && record_type == 'itemfulfillment')
    {
      var d_IF_date_start_date;
      var numLines_IF = SO_obj.getLineCount({sublistId:"item"});
      log.debug('numLines_IF:===',numLines_IF);
      var i_created_so = SO_obj.getValue({fieldId:"createdfrom"});
              var i_status = SO_obj.getValue({fieldId:"shipstatus"});
              if(numLines_IF>0 && i_created_so && i_status == 'C')
      {
        var SO_obj_header = record.load({ type: record.Type.SALES_ORDER, id: i_created_so, isDynamic: true});
        var d_IF_date = SO_obj.getValue({fieldId:"trandate"});
        if(d_IF_date)
        {
          d_IF_date_start_date = format.parse({value:d_IF_date, type: format.Type.DATE});
        }
          
        for (var f=0; f<numLines_IF; f++)
        {
          var b_item_receive = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'itemreceive',line: f});
          if(b_item_receive == true || b_item_receive == 'T')
          {
            var i_line_no = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',line: f});
            if(i_line_no)
            {
              var lineNumber = SO_obj_header.findSublistLineWithValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',value: i_line_no});
              var b_rental = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item',line: lineNumber});
              if(lineNumber>=0 && b_rental)
              {		
                SO_obj_header.selectLine({ sublistId: 'item',line: lineNumber});
                SO_obj_header.setCurrentSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_actual_start_date', value: d_IF_date});
                SO_obj_header.commitLine({sublistId: 'item'});
              }
            }
          }
        }
        var i_SO_header = SO_obj_header.save();
        log.debug(' Dates updated from IF to SO:===',i_SO_header);
      }
    }
         
    if(s_type != 'delete' && record_type == 'returnauthorization')
          {
              var numLines = SO_obj.getLineCount({sublistId:"item"});
              log.debug('RMA numLines:===',numLines);
              if(numLines>0)
              {
                  for (var i=0; i<numLines; i++)
                  {
          var b_rental = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item',line: i});
          if(b_rental)
          {
            SO_obj.setSublistValue({sublistId: 'item',fieldId: 'rate', line: i, value: parseFloat(0).toFixed(2)});
                          SO_obj.setSublistValue({sublistId: 'item',fieldId: 'costestimatetype', line: i, value: 'CUSTOM'});
                          SO_obj.setSublistValue({sublistId: 'item',fieldId: 'costestimate', line: i, value: parseFloat(0).toFixed(2)});
          }
        }
      }
          }

    if(record_type == 'itemreceipt' || record_type == 'itemfulfillment')
    { 
              var numLines_IR = SO_obj.getLineCount({sublistId:"item"});
      log.debug('numLines_IR:===',numLines_IR);
              var i_created_rma = SO_obj.getValue({fieldId:"createdfrom"});
                
              if(s_type == 'delete' && record_type == 'itemreceipt')
              {
                  if(numLines_IR>0 && i_created_rma)
                  {
                      var fieldLookUp = search.lookupFields({type: search.Type.RETURN_AUTHORIZATION,id: i_created_rma,columns: ['createdfrom']});
                      var i_created_so = fieldLookUp.createdfrom[0].value;
                      log.debug('i_created_so:===',i_created_so);
                      if(i_created_so)
                      {
                          var SO_obj_header = record.load({ type: record.Type.SALES_ORDER, id: i_created_so, isDynamic: true});
                          for (var r=0; r<numLines_IR; r++)
                          {
                              var i_line_no = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',line: r});
                              if(i_line_no)
                              {
                                  var lineNumber = SO_obj_header.findSublistLineWithValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',value: i_line_no});
                                  if(lineNumber>=0)
                                  {
                                      SO_obj_header.selectLine({ sublistId: 'item',line: lineNumber});
                                      SO_obj_header.setCurrentSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_actual_end_date', value: ''});
                                      SO_obj_header.commitLine({ sublistId: 'item',line: lineNumber});
                                  }
                              }
                          }
                          SO_obj_header.save();
                      }
                  }	
              }				
              else
              {
                  var i_status;
                  if(numLines_IR>0 && i_created_rma)
                  {
                      if(record_type == 'itemreceipt')
                      {
                          var fieldLookUp = search.lookupFields({type: search.Type.RETURN_AUTHORIZATION,id: i_created_rma,columns: ['createdfrom']});
                          i_created_rma = fieldLookUp.createdfrom[0].value;    
                      }
                      else
                      {
                          i_status = SO_obj.getValue({fieldId:"shipstatus"});
                      }

                      if((i_created_rma && record_type == 'itemreceipt') || (i_created_rma && record_type == 'itemfulfillment' && i_status == 'C'))
                      {
                          var SO_obj_header = record.load({ type: record.Type.SALES_ORDER, id: i_created_rma, isDynamic: true});
                          for (var r=0; r<numLines_IR; r++)
                          {
                              var d_IR_date, d_actual_end_Dt, d_actual_end_date_Mon, expected_end_date_Year, d_actual_end_date_Year, expected_end_Dt, expected_end_date_Mon ;
                              var updated_custom_amount, updated_days, rate_value, d_actual_end_date, ac_start_date, ac_start_date_value; 
                              
                              if(record_type == 'itemreceipt')
                              {
                                  d_actual_end_date = SO_obj.getValue({fieldId:"trandate"});
                                  if(d_actual_end_date)
                                      d_IR_date = format.parse({value:d_actual_end_date, type: format.Type.DATE});
                              }
                              else
                              {
                                  ac_start_date = SO_obj.getValue({fieldId:"trandate"});
                                  if(ac_start_date)
                                  {
                                      ac_start_date_value = format.parse({value:ac_start_date, type: format.Type.DATE});
                                  }
                              }
                             
                              var i_line_no = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',line: r});
                              if(i_line_no)
                {
                                  var lineNumber = SO_obj_header.findSublistLineWithValue({sublistId: 'item',fieldId: 'custcol_pla_line_to_update',value: i_line_no});
                                  var b_rental = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item',line: lineNumber});
                                  if(lineNumber>=0 && b_rental)
                                  {
                                      SO_obj_header.selectLine({ sublistId: 'item',line: lineNumber});
                                      if(record_type == 'itemreceipt')
                                      {
                                          SO_obj_header.setCurrentSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_actual_end_date', value: d_IR_date});
                                          ac_start_date = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_actual_start_date',line: lineNumber});
                                      }
                                      else
                                      {
                                          SO_obj_header.setCurrentSublistValue({ sublistId: 'item',fieldId: 'custcol_pla_actual_start_date', value: ac_start_date_value});
                                          d_actual_end_date = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_actual_end_date',line: lineNumber});
                                      }

                                      log.debug('rental_start_date:===',ac_start_date+'===d_IR_date_end_date:==='+d_actual_end_date);
                                  
                                      if(ac_start_date && d_actual_end_date)
                                      {
                                          var original_rate = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_original_rate', line: lineNumber});
                                          var rate = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'rate',line: lineNumber});
                                          var qty = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: lineNumber});
                                          var days = find_no_of_days(d_actual_end_date, ac_start_date);
                                          var expected_start_date = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_start_date',line: lineNumber});
                                          var expected_end_date = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_end_date',line: lineNumber});
                                          var daily_late_fee =  SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_dailylatefee',line: lineNumber});
                                          var amt = SO_obj_header.getSublistValue({sublistId: 'item',fieldId: 'amount', line:lineNumber});
                                          log.debug('expected_start_date:===',expected_start_date+'===expected_end_date:==='+expected_end_date);
                                          log.debug('rate:===',rate+'===qty:==='+qty);
                                          if(original_rate)
                                          {
                                              rate = original_rate;
                                          }
                                         
                                          if(ac_start_date)
                                          {
                                              ac_start_date = format.format({value:ac_start_date, type: format.Type.DATE});
                                          }
                                          if(d_actual_end_date)
                                          {
                                              d_actual_end_Dt = d_actual_end_date.getDate();
                                              d_actual_end_date_Mon = d_actual_end_date.getMonth() + 1;
                                              d_actual_end_date_Year = d_actual_end_date.getFullYear();
                                              d_actual_end_date = format.format({value:d_actual_end_date, type: format.Type.DATE});
                                          }
                                          if(expected_start_date)
                                          {
                                              expected_start_date = format.format({value:expected_start_date, type: format.Type.DATE});
                                          }
                                          if(expected_end_date)
                                          {
                                              expected_end_Dt = expected_end_date.getDate();
                                              expected_end_date_Mon = expected_end_date.getMonth() + 1;
                                              expected_end_date_Year = expected_end_date.getFullYear();
                                              expected_end_date = format.format({value:expected_end_date, type: format.Type.DATE});
                                          }
                                          log.debug('rental_start_date:===',ac_start_date+'===d_actual_end_date:==='+d_actual_end_date);
                                          log.debug('expected_start_date:===',expected_start_date+'===expected_end_date:==='+expected_end_date);
                                          
                                          if(ac_start_date && expected_start_date && d_actual_end_date && expected_end_date)
                                          {
                                              if(ac_start_date == expected_start_date && d_actual_end_date == expected_end_date)
                                              {
                                                  updated_days = find_no_of_days(d_actual_end_date, ac_start_date);
                                                  //log.debug('updated_days:===',updated_days);
                                                  if(updated_days)
                                                  {
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_duration', value:updated_days});
                                                  }
                                                  updated_custom_amount  = parseFloat(rate) * parseFloat(updated_days);
                                                  rate_value = parseFloat(updated_custom_amount)/qty;
                                                  SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'rate', value: parseFloat(rate_value).toFixed(2)});
                                              }
                                          }

                                          if(ac_start_date == expected_start_date && d_actual_end_date != expected_end_date)
                                          {
                                              var days = find_no_of_days(d_actual_end_date, ac_start_date);
                                              log.debug('days:===',days);
                                                  
                                              if(parseInt(d_actual_end_date_Year) < parseInt(expected_end_date_Year))
                                              {	
                                                  flag = true;	
                                              }
                      
                                              if(parseInt(d_actual_end_date_Year) > parseInt(expected_end_date_Year))
                                              {	
                                                  flag = false;	
                                              }
                                                  
                                              if(parseInt(d_actual_end_date_Year) == parseInt(expected_end_date_Year))
                                              {
                                                  if(parseInt(d_actual_end_date_Mon) < parseInt(expected_end_date_Mon))
                                                  {
                                                      flag = true;	
                                                  }
                                                  else
                                                  {
                                                      flag = false;
                                                  }
                  
                                                  if(parseInt(d_actual_end_date_Mon) == parseInt(expected_end_date_Mon))
                                                  {
                                                      if(parseInt(d_actual_end_Dt) < parseInt(expected_end_Dt))
                                                      {
                                                          flag = true;	
                                                      }
                                                      else
                                                      {
                                                          flag = false;
                                                      }
                                                  }
                                              }
                                              
                                              if (flag == true)
                                              {
                                                  if(days)
                                                  {		
                                                      updated_custom_amount = parseFloat(days) * parseFloat(rate);
                                                      updated_amt_value = parseFloat(amt) + parseFloat(updated_custom_amount);
                                                      //log.debug('updated_custom_amount:===',updated_custom_amount+'===updated_amt_value:==='+updated_amt_value);
                                                  } 
                                              }
                                              else
                                              {
                                                  log.debug('ELSE LOOP');
                                                  var days1 = find_no_of_days(d_actual_end_date, expected_end_date);
                                                  log.debug('days1:===',days1);
                              
                                                  if(days && days1)
                                                  {
                                                      updated_custom_amount = (parseFloat(days1) * parseFloat(daily_late_fee) * parseFloat(qty)) + (parseFloat(days) * parseFloat(rate) * parseFloat(qty));
                                                      updated_amt_value = parseFloat(days1) * parseFloat(daily_late_fee) * parseFloat(qty);
                                                          rate_value = parseFloat(updated_custom_amount)/qty;
                                              
                                                      var daily_late_fee_per_item = parseFloat(days1) * parseFloat(daily_late_fee);
                                                      log.debug('updated_custom_amount:===',updated_custom_amount+'===updated_amt_value:==='+updated_amt_value);
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_overage_days', value:days1});
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_daily_fee_per_item', value:daily_late_fee_per_item});
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_daily_late_fee_per_amt', value:updated_amt_value});
                                                  }
                                              }       
                                              updated_days = find_no_of_days(d_actual_end_date, ac_start_date);
                                              log.debug('updated_days:===',updated_days);
                                          }

                                          if(ac_start_date != expected_start_date)
                                          {
                                              var days = find_no_of_days(d_actual_end_date, ac_start_date);
                                              //log.debug('days:===',days);
                                              
                                              if(parseInt(d_actual_end_date_Year) < parseInt(expected_end_date_Year))
                                              {	
                                                  flag = true;	
                                              }
                          
                                              if(parseInt(d_actual_end_date_Year) > parseInt(expected_end_date_Year))
                                              {	
                                                  flag = false;	
                                              }
                                      
                                              if(parseInt(d_actual_end_date_Year) == parseInt(expected_end_date_Year))
                                              {
                                                  if(parseInt(d_actual_end_date_Mon) < parseInt(expected_end_date_Mon))
                                                  {
                                                      flag = true;	
                                                  }
                                                  else
                                                  {
                                                      flag = false;
                                                  }
              
                                                  if(parseInt(d_actual_end_date_Mon) == parseInt(expected_end_date_Mon))
                                                  {
                                                      if(parseInt(d_actual_end_Dt) < parseInt(expected_end_Dt))
                                                      {
                                                          flag = true;	
                                                      }
                                                      else
                                                      {
                                                          flag = false;
                                                      }
                                                  }
                                              }
                                      
                                              if (flag == true)
                                              {
                                                  if(days)
                                                  {		
                                                      updated_custom_amount = parseFloat(days) * parseFloat(rate);
                                                      updated_amt_value = parseFloat(amt) + parseFloat(updated_custom_amount);
                                                      //log.debug('updated_custom_amount:===',updated_custom_amount+'===updated_amt_value:==='+updated_amt_value);
                                                  } 
                                              }
                                              else
                                              {
                                                  var first_part, second_part;
                                                  var days1 = find_no_of_days(d_actual_end_date, expected_end_date);
                                                  log.debug('days1:===',days1);
                                                      
                                                  if(days)
                                                  {
                                                      first_part = parseFloat(days) * parseFloat(rate) * parseFloat(qty);
                                                  }
                                                  if(days1)
                                                  {
                                                      second_part = parseFloat(days1) * parseFloat(daily_late_fee) * parseFloat(qty);
                                                      var daily_late_fee_per_item = parseFloat(days1) * parseFloat(daily_late_fee);
                                                          
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_overage_days', value:days1});
                                                      if(daily_late_fee_per_item)
                                                          SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_daily_fee_per_item',value:daily_late_fee_per_item});
                                                          
                                                      SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_daily_late_fee_per_amt', value:second_part});
                                                  }
                                  
                                                  if(first_part && second_part)
                                                  {
                                                      updated_custom_amount = parseFloat(first_part) + parseFloat(second_part);
                                                  }
                                                  if(first_part && !second_part)
                                                  {
                                                      updated_custom_amount = parseFloat(first_part);
                                                  }
                                                  if(!first_part && second_part)
                                                  {
                                                      updated_custom_amount = parseFloat(second_part);
                                                  }
                                                  updated_amt_value = parseFloat(amt) + parseFloat(updated_custom_amount);
                                                  log.debug('updated_custom_amount:===',updated_custom_amount+'===updated_amt_value:==='+updated_amt_value); 
                                              }
                                              updated_days = find_no_of_days(d_actual_end_date, ac_start_date);
                                              log.debug('updated_days new use case:===',updated_days);                      
                                          }
                                          if(updated_days)
                                          {
                                              SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_duration', value:updated_days});
                                          }
                                          if(updated_custom_amount)
                                          {
                                              rate_value = parseFloat(updated_custom_amount)/qty;
                                              SO_obj_header.setCurrentSublistValue({sublistId: 'item',fieldId: 'rate', value: parseFloat(rate_value).toFixed(2)}); 
                                          }
                    }
                    SO_obj_header.commitLine({sublistId: 'item'});
                  }
                }
              }
              var i_SO_header = SO_obj_header.save();
              log.debug(' Dates updated from IR/IF to SO:===',i_SO_header);
            }
          }      
              }
    }
    
    if(record_type == 'invoice' && (s_type == 'create' || s_type == 'edit'))
    {
      var numLines = SO_obj.getLineCount({sublistId:"item"});
      log.debug('numLines Invoice:===',numLines);
      for (var i=0; i<numLines; i++)
      {
          var updated_days, updated_custom_amount, rate_value;
          var d_actual_end_Dt, d_actual_end_date_Mon, d_actual_end_date_Year, expected_end_Dt, expected_end_date_Mon, expected_end_date_Year;
             
          var b_rental = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item',line: i});
          if(b_rental)
          {
            var i_rate = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'rate',line: i});
            var amount = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'amount',line: i});
            var qty = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: i});
            var i_rental_item = SO_obj.getSublistValue({sublistId: 'item',fieldId: 'custcol_pla_rental_item_value',line: i});
            //log.debug('i_rate:===',i_rate+'===amount:==='+amount+'===qty:==='+qty+'===i_rental_item:==='+i_rental_item);
            
            if(i_rental_item)
            {
              SO_obj.setSublistValue({sublistId: 'item',fieldId: 'item', line: i, value:i_rental_item});
              SO_obj.setSublistValue({sublistId: 'item',fieldId: 'quantity', line: i, value:qty});
              SO_obj.setSublistValue({sublistId: 'item',fieldId: 'rate', line: i, value:i_rate});
            }
          }
              }
          }
  }
  catch(Exception)
  {
    log.debug('Exception', Exception);
  }
}

//This function will create the new item.	
function afterSubmit(scriptContext)
{
  try
  {
      var s_type = scriptContext.type;
      var Inv_obj = scriptContext.newRecord;
      var record_type = Inv_obj.type;
      var i_inv_id = Inv_obj.id;
  if(record_type == 'serializedinventoryitem')
  {
    if(s_type != 'delete')
          {
      var Item_obj = record.load({ type: record.Type.SERIALIZED_INVENTORY_ITEM, id: i_inv_id, isDynamic: true});
      var b_rental_item = Item_obj.getValue({fieldId:"custitempla_forrental"});
      var i_rental_item = Item_obj.getValue({fieldId:"custitem_pla_rental_item"});
      if(b_rental_item && !i_rental_item)
      {
        var item_id = Item_obj.getValue({fieldId:"itemid"});
        var item_sub = Item_obj.getValue({fieldId:"subsidiary"});
        var tax_sch = Item_obj.getValue({fieldId:"taxschedule"});
        var late_fee = Item_obj.getValue({fieldId:"custitem_pla_dailylatefee"});
        var newItem = record.create({type: record.Type.SERVICE_ITEM,isDynamic: true});
        newItem.setValue({ fieldId: 'itemid', value: 'Rental - ' + item_id});
        newItem.setValue({ fieldId: 'custitem_pla_inventoryitem', value: i_inv_id});
        newItem.setValue({ fieldId: 'subsidiary', value: item_sub});
        newItem.setValue({ fieldId: 'taxschedule', value:tax_sch});
        newItem.setValue({ fieldId: 'custitem_pla_dailylatefee', value:late_fee});
                  
                  var isMultiCurrencyEnabled = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                  log.debug('Multi-Currency Enabled', isMultiCurrencyEnabled);
                  if (isMultiCurrencyEnabled) 
                  {
                     for (var p = 1; p<=15; p++)
                     {
                          var price_sublist = 'price'+p;
                          var priceLineCount = Item_obj.getLineCount({ sublistId: price_sublist });
                          //log.debug('priceLineCount:===',priceLineCount);
                          for (var i = 0; i < priceLineCount; i++) 
                          {
                              var cnt = 1;
                              var price_sublist = 'price'+cnt;
                              var price_field = 'price_'+cnt+'_';
                              var priceLevel = Item_obj.getSublistValue({sublistId: price_sublist,fieldId: 'pricelevel', line: i});
                              var price = Item_obj.getSublistValue({sublistId: price_sublist, fieldId: price_field, line: i  });
                              if(priceLevel && price)
                              {
                                  newItem.selectLine({ sublistId: price_sublist, line: i });
                                  newItem.setCurrentSublistValue({sublistId: price_sublist,fieldId: 'pricelevel', value: priceLevel});
                                  newItem.setCurrentSublistValue({  sublistId: price_sublist,  fieldId: price_field,value: price });
                                  newItem.commitLine({ sublistId: price_sublist });
                              } 
                              cnt++;  
                          }
                     }
                  } 
                  else 
                  {
                      var priceLineCount = Item_obj.getLineCount({ sublistId: 'price' });
                      //log.debug('priceLineCount:===',priceLineCount);
                      for (var i = 0; i < priceLineCount; i++) 
                      {
                          var priceLevel = Item_obj.getSublistValue({sublistId: 'price',fieldId: 'pricelevel', line: i});
                          var price = Item_obj.getSublistValue({sublistId: 'price',fieldId: 'price', line: i  });
                          if(priceLevel && price)
                          {
                              newItem.selectLine({ sublistId: 'price',  line: i });
                              newItem.setCurrentSublistValue({sublistId: 'price',fieldId: 'pricelevel', value: priceLevel});
                              newItem.setCurrentSublistValue({  sublistId: 'price',  fieldId: 'price',value: price });
                              newItem.commitLine({ sublistId: 'price' });
                          }   
                      }
                  }
        var itemId = newItem.save();
        log.debug('itemId:===',itemId);
        
        if(itemId)
        {
          var id = record.submitFields({type: record.Type.SERIALIZED_INVENTORY_ITEM, id: i_inv_id, values: { 'custitem_pla_rental_item': itemId}});
        }
      }  
    }
  }
  }
  catch(e)
  {
      log.error('Exception Caught:===',e);
  }
}

//This function will find the no of days between two dates.
  function find_no_of_days(date2, date1)
  {
      var startDate = new Date(date1);
      var endDate = new Date(date2);

      var timeDifference = endDate - startDate;
      var dayDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      return dayDifference;
  }

      return {
    beforeLoad:beforeLoad,
     beforeSubmit: beforeSubmit,
          afterSubmit:afterSubmit
      };
  });