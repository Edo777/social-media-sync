from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see Campaign fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/Campaign

    __query = """
        SELECT
            %s
        FROM
            campaign
            %s
        ORDER BY
            campaign.id
    """

    def generate_query(self, attributes, ids):
        campaign_attributes = None
        metric_attributes = None

        # set campaign attributes
        if "campaign" in attributes:
            campaign_attributes = attributes["campaign"]
        
        # set metrics
        if "metrics" in attributes:
            metric_attributes = attributes["metrics"]

        if campaign_attributes is None:
            campaign_attributes=["id", "name"]

        fields = ''
        condition = ''

        if ids and (len(ids) != 0):
            condition = 'WHERE campaign.id IN :ids'

        if("id" not in campaign_attributes):
            campaign_attributes.append("id")

        # Loop for campaign's attributes
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

        return (self.__query % (fields, condition))

    # map result row
    def __map_result_row(self, row):
        campaign = self.serialize(row.campaign)
        campaign["metrics"] = self.serialize(row.metrics)
        
        return campaign

    # convert response to serialized campaigns list
    def __response_to_campaigns(self, responses):
        return self.loop_result(
            responses = responses,
            callback = lambda row: self.__map_result_row(row)
        )

    # start execution
    @override_method
    def start_execution(self):
        attributes = self.get_argument("attributes")
        ids = self.get_argument("ids")

        replacements = {}
        if ids and len(ids) != 0:
            replacements["ids"] = tuple(ids)

        generated_query = self.generate_query(attributes, ids)
        responses = self.run_query(generated_query, replacements)
        campaigns = self.__response_to_campaigns(responses)

        return campaigns
