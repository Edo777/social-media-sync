from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaigns
class ExecuteCommand(BaseCommand):
    # you can see AdGroup fields in link in bellow :
    # https://developers.google.com/google-ads/api/reference/rpc/v6/AdGroup

    __query = """
        SELECT
            ad_group.id,
            ad_group.name,
            ad_group.type,
            ad_group.status
        FROM
            ad_group
        WHERE
            campaign.id = :campaign_id
        ORDER BY
            ad_group.id
    """

    # convert response to serialized ad-groups list
    def __response_to_ad_groups(self, responses):
        return self.loop_result(
            responses = responses,
            callback = lambda row: self.serialize(row.ad_group)
        )

    # start execution
    @override_method
    def start_execution(self):
        responses = self.run_query(self.__query, {
            "campaign_id": self.get_argument("campaignId")
        })

        ad_groups = self.__response_to_ad_groups(responses)
        return ad_groups
