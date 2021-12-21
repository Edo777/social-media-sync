from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see AdGroup fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/AdGroup

    __query = """
        SELECT %s FROM ad_group %s
    """
    # map result row
    def __map_result_row(self, row):
        ad_group = self.serialize(row.ad_group)
        ad_group["campaign"] = self.serialize(row.campaign)
        ad_group["metrics"] = self.serialize(row.metrics)
        
        return ad_group

    # convert response to serialized ad-groups list
    def __response_to_ad_groups(self, responses):
        return self.loop_result(
            responses = responses,
            callback = lambda row: self.__map_result_row(row)
        )
        
    # generate query for get ad_groups
    def __generate_query(self, attributes, ids):
        ad_group_attributes = None
        campaign_attributes = None
        metric_attributes = None

        # set campaign attributes
        if "adGroup" in attributes:
            ad_group_attributes = attributes["adGroup"]
        
         # set campaign attributes
        if "campaign" in attributes:
            campaign_attributes = attributes["campaign"]
        
        # set metrics
        if "metrics" in attributes:
            metric_attributes = attributes["metrics"]

        if ad_group_attributes is None:
            ad_group_attributes=["id", "name"]

        fields = ''
        condition = ''

        if("id" not in ad_group_attributes):
            ad_group_attributes.append("id")

        # Loop for ad_group's attributes
        ad_group_constant = 'ad_group.'
        for field in ad_group_attributes:
            fields += (ad_group_constant + field)
            if(ad_group_attributes[-1] != field):
                fields += ','
        
        # Loop for campaign's attributes
        if campaign_attributes is not None:
            fields += ","
            campaign_constant = 'campaign.'
            for field in campaign_attributes:
                fields += (campaign_constant + field)
                if(campaign_attributes[-1] != field):
                    fields += ','

        # Loop for metric's attributes
        if metric_attributes is not None:
            fields += ","
            metrics_constant = 'metrics.'
            for field in metric_attributes:
                fields += (metrics_constant + field)
                if(metric_attributes[-1] != field):
                    fields += ','
        
        if ids and (len(ids) != 0):
            condition = 'WHERE ad_group.id IN :ids'

        return (self.__query % (fields, condition))


    # start execution
    @override_method
    def start_execution(self):
        attributes = self.get_argument("attributes")
        ids = self.get_argument("ids")
        
        generated_query = self.__generate_query(attributes, ids)

        replacements = {}
        if ids and len(ids) != 0:
            replacements["ids"] = tuple(ids) 

        responses = self.run_query(generated_query, replacements)

        ad_groups = self.__response_to_ad_groups(responses)
        return ad_groups
