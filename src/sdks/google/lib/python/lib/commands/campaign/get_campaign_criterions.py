from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaign_criterions
class ExecuteCommand(BaseCommand):
    __query = """
        SELECT
            campaign_criterion.campaign,
            campaign_criterion.criterion_id,
            campaign_criterion.type,
            campaign_criterion.status,
            campaign_criterion.bid_modifier,
            campaign_criterion.negative,
            campaign_criterion.location.geo_target_constant,
            campaign_criterion.language.language_constant
        FROM
            campaign_criterion
        WHERE
            campaign_criterion.campaign = ':campaign_resource'
    """

    # Map result of criterions
    def __map_result_row(self, row):
        return self.serialize(row.campaign_criterion)

    # start execution
    @override_method
    def start_execution(self):
        campaign_id = self.get_argument("campaignId")
        campaign_resource = self.get_resource_by_id("campaigns", campaign_id)

        responses = self.run_query(self.__query, {
            "campaign_resource": campaign_resource
        })

        results = self.loop_result(
            responses = responses,
            callback = lambda row: self.__map_result_row(row)
        )

        return results
