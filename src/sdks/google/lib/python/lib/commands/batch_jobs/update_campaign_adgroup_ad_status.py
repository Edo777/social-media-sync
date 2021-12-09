import asyncio
import time
from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand
from ...exceptions.invalid_arguments_exception import InvalidArgumentsException

from google.api_core import protobuf_helpers

class ExecuteCommand(BaseCommand):
    def _build_mutate_operation(self, operation_type, operation):
        mutate_operation = self.get_type("MutateOperation")
        # Retrieve the nested operation message instance using getattr then copy the
        # contents of the given operation into it using the client.copy_from method.
        self.get_google_ads_client().copy_from(getattr(mutate_operation, operation_type), operation)
        return mutate_operation
    # Here will be updated the campaign fields
    # [name, status, start_date, end_date]
    def __update_campaign_fields(self, campaign, update_data):
        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            campaign.status = self.get_enum(
                "CampaignStatusEnum", update_data["status"])

    def __update_adgroup_fields(self, adgroup, update_data):
        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            adgroup.status = self.get_enum(
                "AdGroupStatusEnum", update_data["status"])
    
    def __update_ad_fields(self, ad, update_data):
        # update status to  -> paused, removed, enabled
        if("status" in update_data):
            ad.status = self.get_enum(
                "AdGroupAdStatusEnum", update_data["status"])

    # Create campaign operation
    def __create_campaign_operation(self, update_data):
        if("campaign" in update_data and "campaignId" in update_data):
            # Get resource of updated campaign -> customers/{customer_id}/campaigns/{campain_id}
            campaign_resource = self.get_resource_by_id(
                "campaigns", update_data["campaignId"])

            # get campaign service and campaign operations
            campaign_operation = self.get_type("CampaignOperation")
            campaign = campaign_operation.update

            # campaign update operation
            campaign.resource_name = campaign_resource

            # can only update campain's ->
            # [name, status, start_date, end_date] fields
            self.__update_campaign_fields(
                campaign=campaign,
                update_data=update_data["campaign"]
            )
            
            # save campaign
            field_mask = protobuf_helpers.field_mask(None, campaign._pb)
            campaign_operation.update_mask.CopyFrom(field_mask)

            return campaign_operation
        else:
            return None
    
    # Create adgroup operation
    def _create_adgroup_operation(self, update_data):
        if("adGroup" in update_data and "adGroupId" in update_data):
            adgroup_resource = self.get_resource_by_id(
                "adGroups", update_data["adGroupId"])

            # get adgroup operations
            operation = self.get_type("AdGroupOperation")
            adgroup = operation.update

            # adgroup update operation
            adgroup.resource_name = adgroup_resource

            # can only update campain's ->
            # [name, status, start_date, end_date] fields
            self.__update_adgroup_fields(
                adgroup=adgroup,
                update_data=update_data["adGroup"]
            )
            
            # save campaign
            field_mask = protobuf_helpers.field_mask(None, adgroup._pb)
            operation.update_mask.CopyFrom(field_mask)

            return operation
        
        return None

        # Create adgroup operation
   
    # Create ad operation
    def _create_ad_operation(self, update_data):
        if("ad" in update_data and "adId" in update_data and "adGroupId" in update_data):
            adId = update_data["adId"]
            adGroupId = update_data["adGroupId"]

            ad_group_ad_resource_name = self.get_resource_by_id(
                    "adGroupAds", adGroupId + "~" + adId)

            # get adgroup ad operations
            operation = self.get_type("AdGroupAdOperation")
            adgroup_ad = operation.update

            # adgroup update operation
            adgroup_ad.resource_name = ad_group_ad_resource_name

            # can only update campain's ->
            # [name, status, start_date, end_date] fields
            
            self.__update_ad_fields(
                ad=adgroup_ad,
                update_data=update_data["ad"]
            )
            
            # save campaign
            field_mask = protobuf_helpers.field_mask(None, adgroup_ad._pb)
            operation.update_mask.CopyFrom(field_mask)

            return operation
        else:
            return None

    # Main update of campaign and it's properties
    def __create_campaign_adgroup_ad_update_operations(self, update_data):
        campaign_operation = self.__create_campaign_operation(update_data=update_data)
        adgroup_operation = self._create_adgroup_operation(update_data=update_data)
        ad_operation = self._create_ad_operation(update_data=update_data)

        ops = {}
        
        if campaign_operation is not None:
            ops["campaign_operation"] = self._build_mutate_operation("campaign_operation", campaign_operation)
        
        if adgroup_operation is not None:
            ops["adgroup_operation"] = self._build_mutate_operation("ad_group_operation", adgroup_operation)
        
        if ad_operation is not None:
            ops["ad_operation"] = self._build_mutate_operation("ad_group_ad_operation", ad_operation)

            
        return ops
    
    # create batch job operation
    def _create_batch_job_operation(self):
        batch_job_operation = self.get_type("BatchJobOperation")
        batch_job = self.get_type("BatchJob")

        self.get_google_ads_client().copy_from(batch_job_operation.create, batch_job)
        return batch_job_operation

    # [START add_complete_campaigns_using_batch_job_1]
    def _add_all_batch_job_operations(self, batch_job_service, operations, resource_name):
        response = batch_job_service.add_batch_job_operations(
            resource_name=resource_name,
            sequence_token=None,
            mutate_operations=operations,
        )

        print(
            f"{response.total_operations} mutate operations have been "
            "added so far."
        )
    
    # Update statuses with batch job
    def __build_all_operations(self):
        data = self.get_argument("data")
        operations = []

        for i in range(len(data)):
            ops = self.__create_campaign_adgroup_ad_update_operations(data[i])

            if("campaign_operation" in ops):
                operations.append(ops["campaign_operation"])
            
            if("adgroup_operation" in ops):
                operations.append(ops["adgroup_operation"])

            if("ad_operation" in ops):
                operations.append(ops["ad_operation"])

        return operations    
    
    # [START add_complete_campaigns_using_batch_job]
    def _create_batch_job(self, batch_job_service, batch_job_operation):
        response = batch_job_service.mutate_batch_job(
            customer_id=self.get_client_customer_id(), operation=batch_job_operation
        )
        resource_name = response.result.resource_name
        return resource_name
    
    # [START add_complete_campaigns_using_batch_job_1]
    def _add_all_batch_job_operations(self, batch_job_service, operations, resource_name):
        response = batch_job_service.add_batch_job_operations(
            resource_name=resource_name,
            sequence_token=None,
            mutate_operations=operations,
        )
    
    # [START add_complete_campaigns_using_batch_job_2]
    def _run_batch_job(self, batch_job_service, resource_name):
        return batch_job_service.run_batch_job(resource_name=resource_name)
    
    # [START add_complete_campaigns_using_batch_job_3]
    def _poll_batch_job(self, operations_response, event):
        loop = asyncio.get_event_loop()

        def _done_callback(future):
            loop.call_soon_threadsafe(event.set)

        operations_response.add_done_callback(_done_callback)
    
    # [START add_complete_campaigns_using_batch_job_4]
    def _fetch_and_print_results(self, batch_job_service, resource_name):
        list_results_request = self.get_type("ListBatchJobResultsRequest")
        list_results_request.resource_name = resource_name
        list_results_request.page_size = 1000

        results = []
        # Gets all the results from running batch job and prints their information.
        batch_job_results = batch_job_service.list_batch_job_results(
            request=list_results_request
        )

        for batch_job_result in batch_job_results:
            status = batch_job_result.status.message
            status = status if status else "N/A"
            result = batch_job_result.mutate_operation_response
            result = result or "N/A"

            results.append({"status" : status})
        
        return results

    # !execution fn
    async def start_execute(self):
        batch_job_service = self.get_service("BatchJobService")
        batch_job_operation = self._create_batch_job_operation()
        resource_name = self._create_batch_job(
            batch_job_service, batch_job_operation
        )

        operations = self.__build_all_operations()

        self._add_all_batch_job_operations(batch_job_service, operations, resource_name)
        operations_response = self._run_batch_job(batch_job_service, resource_name)

        _done_event = asyncio.Event()
        self._poll_batch_job(operations_response, _done_event)

        await _done_event.wait()

        return self._fetch_and_print_results(batch_job_service, resource_name)

    # start execution
    @override_method
    async def start_execution(self):
        info = await self.start_execute()
        return info
