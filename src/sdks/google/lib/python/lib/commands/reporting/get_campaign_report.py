from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see Campaign fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/Campaign

    __query = """
        SELECT
            campaign.id,
            campaign.name,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm,
            metrics.cost_micros
        FROM
            campaign
        WHERE 
            campaign.id=:id
    """

    # map result row
    def __map_result_row(self, row):
        metrics = self.serialize(row.metrics)
        campaign = self.serialize(row.campaign)

        campaign["metrics"] = metrics

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
        responses = self.run_query(self.__query, {
            "id": self.get_argument("campaignId")
        })
        campaign = self.__response_to_campaigns(responses)
        
        return campaign
