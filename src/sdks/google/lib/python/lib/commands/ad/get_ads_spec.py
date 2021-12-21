from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see Ad fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/Ad

    __query = """
        SELECT %s FROM ad_group_ad %s
    """

        # generate query for get ad_groups
    def __generate_query(self, attributes, condition):
        ad_group_attributes = None
        campaign_attributes = None
        ad_group_ad_attributes = None
        ad_attributes=None
        metric_attributes = None

        # set ad_group attributes
        if "adGroup" in attributes and len(attributes["adGroup"]) != 0:
            ad_group_attributes = attributes["adGroup"]
        
        # set campaign attributes
        if "campaign" in attributes and len(attributes["campaign"]) != 0:
            campaign_attributes = attributes["campaign"]
         
        # set ad attributes
        if "adGroupAd" in attributes and len(attributes["adGroupAd"]) != 0:
            ad_group_ad_attributes = attributes["adGroupAd"]
        
        # set ad attributes
        if "ad" in attributes and len(attributes["ad"]) != 0:
            ad_attributes = attributes["ad"]
        
        # set metrics
        if "metrics" in attributes and len(attributes["metrics"]) != 0:
            metric_attributes = attributes["metrics"]

        fields = ''
        cond = ''
        need_separate=False
        
        if ad_group_ad_attributes is not None:
            # Loop for ad_group's attributes
            ad_group_ad_constant = 'ad_group_ad.'
            need_separate = True
            for field in ad_group_ad_attributes:
                fields += (ad_group_ad_constant + field)
                if(ad_group_ad_attributes[-1] != field):
                    fields += ','
        
        if ad_attributes is not None:
            # Loop for ad_group's attributes
            ad_constant = 'ad_group_ad.ad.'
            if need_separate:
                fields += ','

            need_separate = True
            for field in ad_attributes:
                fields += (ad_constant + field)
                if(ad_attributes[-1] != field):
                    fields += ','

        # Loop for ad_group's attributes
        if ad_group_attributes is not None:
            ad_group_constant = 'ad_group.'
            if need_separate:
                fields += ','
            need_separate = True

            for field in ad_group_attributes:
                fields += (ad_group_constant + field)
                if(ad_group_attributes[-1] != field):
                    fields += ','

            
        
        # Loop for campaign's attributes
        if campaign_attributes is not None:
            if need_separate:
                fields += ','

            need_separate = True
            campaign_constant = 'campaign.'
            for field in campaign_attributes:
                fields += (campaign_constant + field)
                if(campaign_attributes[-1] != field):
                    fields += ','

        # Loop for metric's attributes
        if metric_attributes is not None:
            if need_separate:
                fields += ','

            metrics_constant = 'metrics.'
            for field in metric_attributes:
                fields += (metrics_constant + field)
                if(metric_attributes[-1] != field):
                    fields += ','

        if condition is not None:
            field = condition["field"]
            operator = condition["operator"]
            values = condition["values"]
            l = ','
            cond = f'WHERE {field} {operator} ({l.join(map(str, tuple(values)))})'
            
        return (self.__query % (fields, cond))


    # map result row
    def __map_result_row(self, row):
        metrics = self.serialize(row.metrics)
        ad = self.serialize(row.ad_group_ad)
        ad_group = self.serialize(row.ad_group)
        campaign = self.serialize(row.campaign)

        ad["metrics"] = metrics
        ad["ad_group"] = ad_group
        ad["campaign"] = campaign
        return ad

    # convert response to serialized ads list
    def __response_to_ads(self, responses):
        return self.loop_result(
            responses = responses,
            callback = lambda row: self.__map_result_row(row)
        )

    # start execution
    @override_method
    def start_execution(self):
        attributes = self.get_argument("attributes")
        condition = self.get_argument("condition")
        
        final_query = self.__generate_query(attributes, condition)
        
        responses = self.run_query(final_query)
        # return responses.results[0]
        ads = self.__response_to_ads(responses)
        return ads
