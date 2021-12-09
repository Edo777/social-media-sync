# !!! Worked only in V8 !!!

from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: get_campaign_criterions
class ExecuteCommand(BaseCommand):
    __query = """
        SELECT
          accessible_bidding_strategy.id,
          accessible_bidding_strategy.name,
          accessible_bidding_strategy.type,
          accessible_bidding_strategy.owner_customer_id,
          accessible_bidding_strategy.owner_descriptive_name
        FROM accessible_bidding_strategy
    """

    # start execution
    @override_method
    def start_execution(self):
        customer_id = self.get_client_customer_id()
        ads_service = self.get_service("GoogleAdsService")


        stream = ads_service.search_stream(
            customer_id=customer_id, query=self.__query
        )

        results = []
        for response in stream:
            for row in response.results:
                bs = row.accessible_bidding_strategy
                results.append({
                    "id" : bs.id,
                    "name": bs.name,
                    "type" : bs.type_.name,
                })
        
        return results
