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
            campaign.serving_status,
            campaign.status,
            campaign.ad_serving_optimization_status,
            campaign.advertising_channel_type,
            campaign.advertising_channel_sub_type,
            campaign.bidding_strategy_type,
            campaign.url_custom_parameters,
            campaign.app_campaign_setting.bidding_strategy_goal_type,
            campaign.app_campaign_setting.app_store,
            campaign.app_campaign_setting.app_id,
            campaign.network_settings.target_google_search,
            campaign.network_settings.target_search_network,
            campaign.network_settings.target_content_network,
            campaign.network_settings.target_partner_search_network,
            campaign.geo_target_type_setting.positive_geo_target_type,
            campaign.geo_target_type_setting.negative_geo_target_type,
            campaign.local_campaign_setting.location_source_type,
            campaign.experiment_type,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.average_cpm,
            metrics.cost_micros
        FROM
            campaign
        ORDER BY
            campaign.id
    """

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
        responses = self.run_query(self.__query)
        campaigns = self.__response_to_campaigns(responses)

        return campaigns
